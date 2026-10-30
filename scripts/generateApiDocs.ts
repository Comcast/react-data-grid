import { readFile, writeFile } from 'node:fs/promises';
import GithubSlugger from 'github-slugger';
import { SyntaxKind } from 'typescript/ast';
import type {
  FunctionDeclaration,
  InterfaceDeclaration,
  JSDoc,
  JSDocComment,
  JSDocSeeTag,
  NodeArray,
  Node,
  ParameterDeclaration,
  PropertySignatureDeclaration,
  SourceFile,
  TypeElement,
  TypeLiteralNode,
  VariableStatement
} from 'typescript/ast';
import {
  isExportDeclaration,
  isFunctionTypeNode,
  isIdentifier,
  isImportDeclaration,
  isInterfaceDeclaration,
  isJSDocText,
  isTypeAliasDeclaration,
  isTypeLiteralNode,
  isTypeReferenceNode,
  isUnionTypeNode,
  isVariableStatement
} from 'typescript/ast/is';
import { getLeadingCommentRanges } from 'typescript/ast/scanner';
import { API } from 'typescript/sync';

// Generates the API reference of the README from the declarations and JSDoc comments of `lib/index.d.ts`,
// which `vp pack` bundles from the sources. The items are listed in the order they are exported from `src/index.ts`.

const declarationsPath = 'lib/index.d.ts';
const entryPath = 'src/index.ts';
const readmePath = 'README.md';
const startMarker = '<!-- api:start -->';
const endMarker = '<!-- api:end -->';
// the sections of the API reference, set by comments above the exports of the entry point, e.g. `// Hooks`
const sections = ['Components', 'Hooks', 'Render Functions', 'Context', 'Other', 'Types'];

interface Doc {
  summary: string;
  tags: { name: string; text: string }[];
}

interface GeneratedHeading {
  line: string;
  key: string | undefined;
}

interface Declaration {
  name: string;
  node: Node;
  doc: Doc;
}

using api = new API();
using declarationsFile = api.createSourceFile(
  declarationsPath,
  await readFile(declarationsPath, 'utf8')
);
using entryFile = api.createSourceFile(entryPath, await readFile(entryPath, 'utf8'));

const declarations = new Map<string, Declaration>();
// exported name -> declared name, e.g. `Cell` -> `MemoCell`
const exportedNames = new Map<string, string>();

for (const statement of declarationsFile.sourceFile.statements) {
  if (isImportDeclaration(statement)) continue;
  if (isExportDeclaration(statement)) {
    for (const specifier of getExportSpecifiers(statement)) {
      exportedNames.set(
        specifier.name.getText(),
        (specifier.propertyName ?? specifier.name).getText()
      );
    }
    continue;
  }
  const name = getDeclarationName(statement);
  const { modifiers } = statement as InterfaceDeclaration;
  if (modifiers?.some((modifier) => modifier.kind === SyntaxKind.ExportKeyword)) {
    exportedNames.set(name, name);
  }
  declarations.set(name, { name, node: statement, doc: getDoc(statement) });
}

// group the exports by their section, in the order they are exported from the entry point
const groups = new Map<string, Declaration[]>(sections.map((section) => [section, []]));
for (const { name, section } of getExports(entryFile.sourceFile)) {
  const declaration = declarations.get(exportedNames.get(name)!);
  if (declaration === undefined) throw new Error(`${name} is not exported by ${declarationsPath}`);
  groups.get(section)!.push({ ...declaration, name });
}

// the types that are referenced by the exports, but not exported:
// the documented ones are listed after the exported types,
// the other ones are shown with the types that reference them
const exportedDeclarations = new Set(exportedNames.values());
const internalTypes = [...declarations.values()].filter(
  // `Omit` works like the built-in `Omit`
  ({ name, node }) => !exportedDeclarations.has(name) && isType(node) && name !== 'Omit'
);
const helperTypes = new Map(
  internalTypes.filter(({ doc }) => doc.summary === '').map((type) => [type.name, type])
);
groups
  .get('Types')!
  .push(...internalTypes.filter(({ name }) => !helperTypes.has(name)).toSorted(compareNames));

// the generated headings, with the key to resolve the links to them
const generatedHeadings: GeneratedHeading[] = [];
// the types shown as a code block, whose members link to the type
const codeBlockTypes = new Set<string>();
// the targets of the links in the comments of code blocks, which are shown as text but must exist
const codeBlockLinks = new Set<string>();
const markdown: string[] = [];

for (const [section, items] of groups) {
  markdown.push(heading(3, section));
  const propsInterfaces = new Map(
    items.filter(({ node }) => isType(node)).map((item) => [item.name, item])
  );
  for (const item of items) {
    if (section === 'Components' && isType(item.node)) {
      // the props interface of a component is listed after it
      if (!items.some(({ name }) => item.name === `${name}Props`)) {
        throw new Error(`${item.name} must be the props of a component, or be listed under Types`);
      }
      continue;
    }
    // e.g. `DataGridProps` after `DataGrid`
    const propsInterface =
      section === 'Components' ? propsInterfaces.get(`${item.name}Props`) : undefined;
    markdown.push(renderItem(item, section, propsInterface !== undefined));
    if (propsInterface !== undefined) markdown.push(renderType(propsInterface, 5));
  }
}

const readme = await readFile(readmePath, 'utf8');
const startIndex = readme.indexOf(startMarker);
const endIndex = readme.indexOf(endMarker);

if (startIndex === -1 || endIndex < startIndex) {
  throw new Error(`${readmePath} must contain ${startMarker} followed by ${endMarker}`);
}

await writeFile(
  readmePath,
  resolveLinks(
    readme.slice(0, startIndex + startMarker.length),
    markdown.join('\n\n'),
    readme.slice(endIndex)
  )
);

function renderItem(item: Declaration, section: string, hasPropsInterface: boolean) {
  const { name, node, doc } = item;
  if (isType(node)) return renderType(item, 4);

  if (section === 'Components') {
    const title = heading(4, `\`<${name} />\``, name);
    // the props interface of a component is listed after it, e.g. `DataGridProps` after `DataGrid`
    if (hasPropsInterface) return [title, ...renderSummary(doc), ...renderTags(doc)].join('\n\n');

    const propsType = getComponentPropsType(node);
    const typeName = /^\w+/.exec(propsType)![0];
    if (helperTypes.has(typeName)) {
      throw new Error(`${typeName}, the props of ${name}, must have a JSDoc comment`);
    }
    return [
      title,
      ...renderSummary(doc),
      ...renderTags(doc),
      heading(5, 'Props'),
      `[\`${propsType}\`](#!${typeName})`
    ].join('\n\n');
  }

  const isFunction = !isVariableStatement(node);
  return [
    heading(4, `\`${name}${isFunction ? '()' : ''}\``, name),
    codeBlock(
      isFunction
        ? getFunctionSignature(name, node as FunctionDeclaration)
        : getVariableSignature(name, node)
    ),
    ...renderSummary(doc),
    ...renderTags(doc)
  ].join('\n\n');
}

function renderType({ name, node, doc }: Declaration, level: number) {
  const isInternal = !exportedDeclarations.has(name);
  // the props interfaces of the components are titled by their name, e.g. `DataGridProps`
  const md = [
    heading(level, level === 4 ? `\`${name}\`${isInternal ? ' (internal)' : ''}` : name, name),
    ...renderSummary(doc)
  ];

  if (isInterfaceDeclaration(node) && hasRichMembers(node)) {
    // a heading per member, as their docs have examples, lists, or several paragraphs
    if (getBaseTypes(node).some((base) => helperTypes.has(getBaseTypeName(base)))) {
      throw new Error(`${name} must not extend undocumented types, as their members would be lost`);
    }
    md.push(...renderTags(doc), ...renderMembers(node.members, level + 1, name));
  } else {
    codeBlockTypes.add(name);
    md.push(codeBlock(getTypeDeclarations(node)), ...renderTags(doc));
  }

  return md.join('\n\n');
}

function renderMembers(members: NodeArray<TypeElement>, level: number, parent: string): string[] {
  return members.flatMap((member) => {
    const name = getMemberName(member);
    const doc = getDoc(member);
    const typeLiteral = findTypeLiteral((member as PropertySignatureDeclaration).type);
    // e.g. `editorOptions`, which is an object, has a heading per option
    if (typeLiteral !== undefined) {
      return [
        heading(level, `\`${name}\``, `${parent}.${name}`),
        ...renderSummary(doc),
        ...renderTags(doc),
        ...renderMembers(typeLiteral.members, Math.min(level + 1, 6), `${parent}.${name}`)
      ];
    }
    const isOptional = (member as PropertySignatureDeclaration).postfixToken !== undefined;
    return [
      heading(level, `\`${name}${isOptional ? '?' : ''}\``, `${parent}.${name}`),
      codeBlock(member.getText()),
      ...renderSummary(doc),
      ...renderTags(doc)
    ];
  });
}

function renderSummary({ summary }: Doc) {
  return summary === '' ? [] : [summary];
}

function renderTags({ tags }: Doc) {
  const labels: Record<string, string> = {
    defaultValue: '**Default:** ',
    example: '**Example:**\n\n',
    see: '**See also:** ',
    returns: '**Returns:**\n\n'
  };
  return tags
    .filter(({ name }) => {
      // the type parameters are described in the "Generics" section
      if (name === 'typeParam') return false;
      if (name in labels) return true;
      throw new Error(`The @${name} tag is not supported in the API reference`);
    })
    .map(({ name, text }) => `${labels[name]}${text}`);
}

// e.g. `RenderRowProps<R, SR>`
function getComponentPropsType(node: Node) {
  const signature = isVariableStatement(node) ? getVariableDeclaration(node).type! : node;
  if (!isFunctionTypeNode(signature) && signature.kind !== SyntaxKind.FunctionDeclaration) {
    throw new Error(`${getDeclarationName(node)} must be a function component`);
  }
  return cleanCode((signature as FunctionDeclaration).parameters[0].type!.getText());
}

// e.g. `function renderHeaderCell<R, SR>(props: RenderHeaderCellContentProps<R, SR>): …`
function getFunctionSignature(name: string, node: FunctionDeclaration) {
  const params = node.parameters.map((param: ParameterDeclaration) => {
    // destructured parameters are named `props`
    const paramName = isIdentifier(param.name) ? param.name.text : 'props';
    return `${paramName}: ${param.type!.getText()}`;
  });
  const returnType = node.type === undefined ? '' : `: ${node.type.getText()}`;
  return `function ${name}${getTypeParameters(node)}(${params.join(', ')})${returnType};`;
}

// e.g. `const SelectColumn: Column<any, any>;` or `const SELECT_COLUMN_KEY = 'rdg-select-column';`
function getVariableSignature(name: string, node: VariableStatement) {
  const { initializer, type } = getVariableDeclaration(node);
  if (initializer !== undefined) {
    return `const ${name} = ${initializer.getText().replaceAll('"', "'")};`;
  }
  return `const ${name}: ${type!.getText()};`;
}

// e.g. `<R, SR = unknown>`
function getTypeParameters(node: { typeParameters?: NodeArray<Node> | undefined }) {
  const { typeParameters } = node;
  if (typeParameters === undefined) return '';
  return `<${typeParameters.map((parameter) => parameter.getText()).join(', ')}>`;
}

// the declaration of a type: an interface includes the members of the helper interfaces it extends,
// e.g. `RenderRowProps` and `BaseRenderRowProps`, and a type alias is followed by the helper types it references,
// e.g. `CellKeyDownArgs` and `ActiveCellKeyDownArgs`
function getTypeDeclarations(node: Node) {
  if (isInterfaceDeclaration(node)) return getInterfaceDeclaration(node);

  const referenced = new Set(
    Array.from(node.getText().matchAll(/\b\w+\b/g), ([name]) => helperTypes.get(name)?.node)
  );
  referenced.delete(undefined);
  referenced.delete(node);
  return [node, ...referenced]
    .map((declaration) =>
      isInterfaceDeclaration(declaration!)
        ? getInterfaceDeclaration(declaration)
        : declaration!.getText()
    )
    .join('\n\n');
}

function getInterfaceDeclaration(node: InterfaceDeclaration) {
  if (getBaseTypes(node).every((base) => !helperTypes.has(getBaseTypeName(base)))) {
    return node.getText();
  }

  const { heritage, members } = getInterfaceParts(node);
  const extendsClause = heritage.length === 0 ? '' : ` extends ${heritage.join(', ')}`;
  const body = Array.from(members.values(), (member) => `  ${member}`).join('\n');
  return `interface ${node.name.text}${getTypeParameters(node)}${extendsClause} {\n${body}\n}`;
}

// the base types and members of an interface, with the members of the helper interfaces it extends
function getInterfaceParts(node: InterfaceDeclaration) {
  const heritage: string[] = [];
  const members = new Map<string, string>();

  for (const base of getBaseTypes(node)) {
    const helperType = helperTypes.get(getBaseTypeName(base));
    if (helperType !== undefined && isInterfaceDeclaration(helperType.node)) {
      const parts = getInterfaceParts(helperType.node);
      heritage.push(...parts.heritage);
      for (const [name, member] of parts.members) members.set(name, member);
    } else {
      heritage.push(base.getText());
    }
  }

  for (const member of node.members) {
    const name = getMemberName(member);
    const jsDoc = getJSDoc(member);
    // a redeclared member replaces the inherited one
    members.delete(name);
    members.set(name, `${jsDoc === undefined ? '' : `${jsDoc.getText()}\n  `}${member.getText()}`);
  }

  return { heritage, members };
}

function getBaseTypes(node: InterfaceDeclaration): readonly Node[] {
  return node.heritageClauses?.flatMap((clause) => clause.types) ?? [];
}

// e.g. `BaseRenderRowProps` for `BaseRenderRowProps<R, SR>`
function getBaseTypeName(base: Node) {
  return /^[\w.]+/.exec(base.getText())![0];
}

function compareNames(a: Declaration, b: Declaration) {
  return a.name.localeCompare(b.name);
}

function isType(node: Node) {
  return isInterfaceDeclaration(node) || isTypeAliasDeclaration(node);
}

// members with more than a single paragraph can't be shown as comments of a code block
function hasRichMembers(node: InterfaceDeclaration) {
  return node.members.some((member) => {
    const { summary, tags } = getDoc(member);
    return (
      tags.some((tag) => tag.name !== 'defaultValue') ||
      summary.includes('\n\n') ||
      summary.includes('```') ||
      /^\s*(?:[-*+]|\d+\.) /m.test(summary)
    );
  });
}

// the object type of a member, e.g. `Maybe<{ … }>`
function findTypeLiteral(node: Node | undefined): TypeLiteralNode | undefined {
  if (node === undefined || isTypeLiteralNode(node)) return node;
  // not in function types, e.g. `(args: { … }) => void`
  if (isTypeReferenceNode(node) || isUnionTypeNode(node)) return node.forEachChild(findTypeLiteral);
  return undefined;
}

function getDeclarationName(node: Node) {
  if (isVariableStatement(node)) return getVariableDeclaration(node).name.getText();
  return (node as InterfaceDeclaration).name.text;
}

function getVariableDeclaration(node: VariableStatement) {
  return node.declarationList.declarations[0];
}

function getMemberName(member: TypeElement) {
  // e.g. `'aria-label'`
  return (member as PropertySignatureDeclaration).name.getText().replaceAll(/^['"]|['"]$/g, '');
}

function getExportSpecifiers(node: Node) {
  if (!isExportDeclaration(node) || node.exportClause?.kind !== SyntaxKind.NamedExports) return [];
  return node.exportClause.elements;
}

// the exported names of the entry point in order, with the section of the comment above them, e.g. `// Hooks`
function getExports(entry: SourceFile) {
  const exports: { name: string; section: string }[] = [];
  let section: string | undefined;
  for (const statement of entry.statements) {
    const specifiers = getExportSpecifiers(statement);
    if (specifiers.length === 0) continue;
    const comment = getLeadingCommentRanges(entry.text, statement.pos)?.at(-1);
    if (comment !== undefined) {
      section = entry.text.slice(comment.pos, comment.end).replace(/^\/\/\s*/, '');
      if (!sections.includes(section)) {
        throw new Error(`"${section}" in ${entryPath} must be one of: ${sections.join(', ')}`);
      }
    }
    if (section === undefined) {
      throw new Error(`The exports of ${entryPath} must follow a section comment, e.g. // Hooks`);
    }
    for (const specifier of specifiers) exports.push({ name: specifier.name.getText(), section });
  }
  for (const name of exportedNames.keys()) {
    if (!exports.some((item) => item.name === name)) {
      throw new Error(`${name} must be exported by name from ${entryPath}`);
    }
  }
  return exports;
}

// the JSDoc comment directly before the node
function getJSDoc(node: Node) {
  return node.jsDoc?.at(-1) as JSDoc | undefined;
}

function getDoc(node: Node): Doc {
  const jsDoc = getJSDoc(node);
  return {
    summary: renderComment(jsDoc?.comment),
    tags: (jsDoc?.tags ?? []).map((tag) => {
      // e.g. `Column` for `@see Column`
      const nameExpression = (tag as Partial<JSDocSeeTag>).nameExpression?.getText();
      const text = renderComment(tag.comment);
      return {
        name: tag.tagName.text,
        text:
          nameExpression === undefined
            ? text
            : `[\`${nameExpression}\`](#!${nameExpression}) ${text}`.trim()
      };
    })
  };
}

// the text of a comment, with its links as "[`width`](#!Column.width)", resolved by `resolveLinks`
function renderComment(comment: NodeArray<JSDocComment> | undefined) {
  if (comment === undefined) return '';
  return comment
    .map((part) => {
      if (isJSDocText(part)) return part.text;
      const target = part.name!.getText();
      // e.g. `| width` for `{@linkcode Column.width | width}`
      const label = part.text.replace(/^\s*\|/, '').trim();
      return `[\`${label === '' ? target : label}\`](#!${target})`;
    })
    .join('')
    .trim();
}

function heading(level: number, text: string, key?: string) {
  const line = `${'#'.repeat(level)} ${text}`;
  generatedHeadings.push({ line, key });
  return line;
}

function codeBlock(text: string) {
  return `\`\`\`tsx\n${cleanCode(text)}\n\`\`\``;
}

// show the declarations without the `declare` keyword, link tags, and `NoInfer`,
// which only affects type inference
function cleanCode(text: string) {
  return text
    .replaceAll(/^(?:export )?declare /gm, '')
    .replaceAll('import("react").', 'React.')
    .replaceAll(
      /\{@link(?:code|plain)?\s+([^}|]+?)\s*(?:\|\s*([^}]+?)\s*)?\}/g,
      (_, target: string, label: string | undefined) => {
        codeBlockLinks.add(target);
        return label ?? target;
      }
    )
    .replaceAll(/NoInfer<([^<>]+)>/g, '$1');
}

// replace the links to items and members, e.g. `#!Column` and `#!Column.width`,
// with the anchors GitHub generates for their headings, which are numbered across the whole README.
// Links in the hand-written sections of the README can link to an item or member with its name as
// the link title, e.g. `[width](#width "Column.width")`, to update the anchor when the numbering changes.
function resolveLinks(precedingMarkdown: string, api: string, followingMarkdown: string) {
  const slugger = new GithubSlugger();
  const anchors = new Map<string, string>();
  const slugHeadings = (markdown: string, headings?: GeneratedHeading[]) => {
    let previousLine = '';
    forEachLine(markdown, (line, isInCodeBlock) => {
      // e.g. "Usage" followed by "---", which the generator never writes
      if (
        headings !== undefined &&
        !isInCodeBlock &&
        /^ {0,3}(?:=+|-+)\s*$/.test(line) &&
        previousLine.trim() !== ''
      ) {
        throw new Error(`The heading "${previousLine}" must not be in a JSDoc comment`);
      }
      previousLine = isInCodeBlock ? '' : line;
      const match = isInCodeBlock ? null : /^#{1,6} (.+)$/.exec(line);
      if (match === null) return;
      const anchor = slugger.slug(match[1].replaceAll('`', ''));
      if (headings === undefined) return;
      // the generated headings are matched in order
      const generated = headings.shift();
      if (generated?.line !== line) {
        throw new Error(`The heading "${line}" must not be in a JSDoc comment`);
      }
      if (generated.key !== undefined) anchors.set(generated.key, anchor);
    });
  };

  slugHeadings(precedingMarkdown);
  slugHeadings(api, [...generatedHeadings]);
  slugHeadings(followingMarkdown);

  const getAnchor = (target: string) => {
    const [type, ...members] = target.split('.');
    // the members of types shown as a code block link to their type
    const anchor =
      anchors.get(target) ??
      (members.length === 1 && codeBlockTypes.has(type) ? anchors.get(type) : undefined);
    if (anchor === undefined) throw new Error(`The link to ${target} does not match any heading`);
    return anchor;
  };
  for (const target of codeBlockLinks) getAnchor(target);

  return `${precedingMarkdown}\n\n${api}\n\n${followingMarkdown}`
    .replaceAll(/\]\(#!([^)]+)\)/g, (_, target: string) => `](#${getAnchor(target)})`)
    .replaceAll(
      /\]\(#[^ )]+ (["'])([\w.]+)\1\)/g,
      (_, quote: string, target: string) => `](#${getAnchor(target)} ${quote}${target}${quote})`
    );
}

function forEachLine(markdown: string, callback: (line: string, isInCodeBlock: boolean) => void) {
  let fence: string | undefined;
  for (const line of markdown.split('\n')) {
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence === undefined) {
      if (fenceMatch !== null) fence = fenceMatch[1];
      callback(line, fence !== undefined);
    } else {
      callback(line, true);
      // a closing fence uses the same character, at least as many times, and has no info string
      if (
        fenceMatch !== null &&
        fenceMatch[1].startsWith(fence[0]) &&
        fenceMatch[1].length >= fence.length &&
        line.trim() === fenceMatch[1]
      ) {
        fence = undefined;
      }
    }
  }
}
