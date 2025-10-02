// db/moduleRepo.js
const sql = require('mssql');
const sqlConfig = require('../config/db');

async function getModuleTemplate(mailType) {
  const pool = await sql.connect(sqlConfig); 
  const { recordset } = await pool.request()
    .input('mailType', sql.NVarChar(100), mailType)
    .query(`
      SELECT TOP 1 MailSubject, MailDescription
      FROM dbo.Module
      WHERE MailType = @mailType AND Active = 'Y'
      ORDER BY UpdatedAt DESC, ModuleId DESC;
    `);
  return recordset[0] || null;
}

function renderTemplate(htmlOrSubject, vars = {}) {
  if (!htmlOrSubject) return '';
  const { name = '', email = '' } = vars;
  return htmlOrSubject
    .replace(/{{\s*name\s*}}/gi, name)
    .replace(/{{\s*email\s*}}/gi, email)
    .replace(/#username/gi, name); 
}

function htmlToText(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = { getModuleTemplate, renderTemplate, htmlToText };
