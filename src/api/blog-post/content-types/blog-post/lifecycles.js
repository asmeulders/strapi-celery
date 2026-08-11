'use strict';

module.exports = {
  beforeCreate(event) {
    const { data } = event.params;
    if (!data.dateModified) {
      data.dateModified = data.datePublished || new Date().toISOString();
    }
  },
  beforeUpdate(event) {
    const { data } = event.params;
    if (data && !Object.prototype.hasOwnProperty.call(data, 'dateModified')) {
      data.dateModified = new Date().toISOString();
    }
  },
};
