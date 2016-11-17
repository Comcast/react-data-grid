const React = require('react');

const CheckboxEditor = React.createClass({
  propTypes: {
    value: React.PropTypes.bool,
    rowIdx: React.PropTypes.number,
    column: React.PropTypes.shape({
      key: React.PropTypes.string,
      onCellChange: React.PropTypes.func
    }),
    dependentValues: React.PropTypes.object
  },

  getValue() {
    return this._inputNode.value;
  },

  getInputNode() {
    return this._inputNode;
  },

  handleChange(e: Event) {
    this.props.column.onCellChange(this.props.rowIdx, this.props.column.key, this.props.dependentValues, e);
  },

  render(): ? ReactElement {
    let checked = this.props.value != null ? this.props.value : false;
    let checkboxName = 'checkbox' + this.props.rowIdx;
    return (
      <div className="react-grid-checkbox-container" onClick={this.handleChange}>
          <input ref={i => this._inputNode = i} className="react-grid-checkbox" type="checkbox" name={checkboxName} checked={checked} />
          <label htmlFor={checkboxName} className="react-grid-checkbox-label"></label>
      </div>);
  }
});

module.exports = CheckboxEditor;
