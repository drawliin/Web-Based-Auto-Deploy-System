const fs = require('fs');

function renderTemplate(templatePath, variables = {}) {
  const template = fs.readFileSync(templatePath, 'utf8');

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!(key in variables)) {
      throw new Error(`Missing template variable: ${key}`);
    }

    return String(variables[key]);
  });
}

module.exports = {
  renderTemplate,
};
