const _isActive = Structure.prototype.isActive;
Structure.prototype.isActive = function() {
    const curActive = _isActive.call(this);
    this.isActive = function() { return curActive };
    return curActive;
};
