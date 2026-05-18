const { PrismaClient } = require('@prisma/client');
const { getDprStatus, countNotFilled, getMonthDateRange } = require('../utils/dprStatus');
const employeeService = require('./employeeService');

const prisma = new PrismaClient();

async function getDashboardStatus({ month, year, search = '', page = 1, limit = 10, sortBy = 'employee_name', sortOrder = 'asc' }) {
  const employees = await employeeService.getAllVisibleEmployees(year, month);
  const filtered = search
    ? employees.filter(
        (e) =>
          e.employee_name.toLowerCase().includes(search.toLowerCase()) ||
          e.employee_id.toLowerCase().includes(search.toLowerCase()) ||
          e.email.toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const { start, end } = getMonthDateRange(year, month);
  const entries = await prisma.dprEntry.findMany({
    where: {
      employee_id: { in: filtered.map((e) => e.id) },
      dpr_date: { gte: start, lte: end },
    },
  });

  const byEmployee = {};
  for (const entry of entries) {
    if (!byEmployee[entry.employee_id]) byEmployee[entry.employee_id] = [];
    byEmployee[entry.employee_id].push(entry);
  }

  let rows = filtered.map((emp) => {
    const empEntries = byEmployee[emp.id] || [];
    const status = getDprStatus(empEntries);
    const notFilledCount = countNotFilled(empEntries);
    return {
      id: emp.id,
      employee_name: emp.employee_name,
      employee_id: emp.employee_id,
      email: emp.email,
      dpr_status: status.label,
      badge_class: status.badgeClass,
      not_filled_count: notFilledCount,
    };
  });

  const allowedSort = ['employee_name', 'employee_id', 'email', 'dpr_status', 'not_filled_count'];
  const field = allowedSort.includes(sortBy) ? sortBy : 'employee_name';
  const dir = sortOrder === 'desc' ? -1 : 1;

  rows.sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (typeof av === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });

  const total = rows.length;
  const skip = (page - 1) * limit;
  const paginated = rows.slice(skip, skip + limit);

  const summary = {
    Excellent: 0,
    Best: 0,
    Better: 0,
    Good: 0,
    Improvement: 0,
    Critical: 0,
    total: rows.length,
  };

  for (const row of rows) {
    summary[row.dpr_status]++;
  }

  return {
    data: paginated,
    summary,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    month,
    year,
  };
}

async function sendMissingDaysNotification({ employee_id, month, year }) {
  const employee = await prisma.employee.findUnique({ where: { employee_id } });
  if (!employee) {
    const err = new Error('Employee not found');
    err.statusCode = 404;
    throw err;
  }

  if (!employee.email) {
    const err = new Error('Employee does not have an email address');
    err.statusCode = 400;
    throw err;
  }

  const { start, end } = getMonthDateRange(year, month);
  const entries = await prisma.dprEntry.findMany({ where: { employee_id: employee.id, dpr_date: { gte: start, lte: end } } });
  const notFilledCount = countNotFilled(entries);
  
  const notFilledDates = entries
    .filter((e) => e.status === 'Not_Filled')
    .map((e) => {
      const dateObj = new Date(e.dpr_date);
      return dateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    })
    .sort();

  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });
  const subject = `DPR Submission Reminder - ${employee.employee_name} - ${monthName} ${year}`;
  
  const datesList = notFilledDates.length > 0 ? notFilledDates.map((d) => `  • ${d}`).join('\n') : '  (No specific dates recorded)';
  
  const text = `Dear ${employee.employee_name},

This is a reminder that your Daily Progress Report (DPR) entries for the month of ${monthName} ${year} are pending for ${notFilledCount} day(s).

Kindly submit the pending DPR entries at the earliest to ensure records are updated accurately and on time.

The following dates are pending for DPR submission:
${datesList}

Regards,
DPR Team`;

  // Prefer SendGrid API when configured to avoid SMTP username/password issues
  const provider = (process.env.MAILER_PROVIDER || '').toLowerCase();
  if (provider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: employee.email,
      cc: 'nilesh.dhumale@epcproman.com,sanjeev@epcproman.com',
      from: process.env.SENDGRID_SENDER || process.env.SMTP_USER || 'dprepcproman@gmail.com',
      subject,
      text,
    };
    try {
      await sgMail.send(msg);
    } catch (err) {
      const sgBody = err?.response?.body;
      let details = '';
      if (sgBody) {
        if (Array.isArray(sgBody.errors)) details = sgBody.errors.map((it) => it.message).join('; ');
        else details = JSON.stringify(sgBody);
      }
      const msgErr = `SendGrid send failed${details ? ': ' + details : ': ' + (err.message || err.toString())}`;
      // Detect sender identity rejection and attempt SMTP fallback if available
      const senderIdentityRejected = /does not match a verified Sender Identity|not a verified sender identity/i.test(details || '') || /sender identity/i.test(details || '');
      if (senderIdentityRejected && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const nodemailer = require('nodemailer');
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: smtpUser, pass: smtpPass } });
        const mailOptions = { from: process.env.SENDGRID_SENDER || smtpUser, to: employee.email, cc: 'nilesh.dhumale@epcproman.com,sanjeev@epcproman.com', subject, text };
        try {
          await transporter.sendMail(mailOptions);
          return { employee_id: employee.employee_id, email: employee.email, not_filled_count: notFilledCount, fallback: 'smtp' };
        } catch (smtpErr) {
          const combined = `${msgErr}; SMTP fallback failed: ${smtpErr.message || smtpErr.toString()}`;
          const e2 = new Error(combined);
          e2.statusCode = 502;
          throw e2;
        }
      }
      const e = new Error(msgErr);
      e.statusCode = 502;
      throw e;
    }
    return { employee_id: employee.employee_id, email: employee.email, not_filled_count: notFilledCount };
  }

  // Fallback to SMTP via nodemailer
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure = process.env.SMTP_SECURE !== undefined ? String(process.env.SMTP_SECURE).toLowerCase() === 'true' : smtpPort === 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromAddress = process.env.EMAIL_FROM || smtpUser;

  if (!smtpUser || !smtpPass) {
    const e = new Error('SMTP is not configured. Set SMTP_USER and SMTP_PASS in your environment, or configure SendGrid with MAILER_PROVIDER=sendgrid and SENDGRID_API_KEY.');
    e.statusCode = 502;
    throw e;
  }

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const mailOptions = {
    from: fromAddress,
    to: employee.email,
    cc: 'nilesh.dhumale@epcproman.com,sanjeev@epcproman.com',
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    const smtpMsg = err && (err.message || err.toString());
    if (err && (err.code === 'EAUTH' || /535|BadCredentials|Authentication failed|Invalid login/.test(String(smtpMsg)))) {
      const e = new Error(`SMTP authentication failed: ${smtpMsg}. Ensure Gmail App Password is created and SMTP_USER/SMTP_PASS are set correctly.`);
      e.statusCode = 502;
      throw e;
    }
    const e = new Error(`SMTP send failed: ${smtpMsg}`);
    e.statusCode = 502;
    throw e;
  }

  return { employee_id: employee.employee_id, email: employee.email, not_filled_count: notFilledCount };
}

module.exports = { getDashboardStatus, sendMissingDaysNotification };

async function sendNotificationsToAll({ month, year }) {
  const employees = await employeeService.getAllVisibleEmployees(year, month);
  if (!employees || employees.length === 0) return { total: 0, sent: 0, skipped: 0, failed: [] };

  const { start, end } = getMonthDateRange(year, month);
  const entries = await prisma.dprEntry.findMany({ where: { employee_id: { in: employees.map((e) => e.id) }, dpr_date: { gte: start, lte: end } } });
  const byEmployee = {};
  for (const entry of entries) {
    if (!byEmployee[entry.employee_id]) byEmployee[entry.employee_id] = [];
    byEmployee[entry.employee_id].push(entry);
  }

  const toNotify = employees.filter((emp) => {
    const empEntries = byEmployee[emp.id] || [];
    const notFilled = countNotFilled(empEntries);
    return notFilled > 0;
  });

  const results = { total: employees.length, candidates: toNotify.length, sent: 0, skipped: employees.length - toNotify.length, failed: [] };

  const BATCH = 6;
  for (let i = 0; i < toNotify.length; i += BATCH) {
    const batch = toNotify.slice(i, i + BATCH);
    const promises = batch.map((emp) =>
      sendMissingDaysNotification({ employee_id: emp.employee_id, month, year }).then(
        (r) => ({ ok: true, result: r }),
        (err) => ({ ok: false, error: err && (err.message || String(err)), employee_id: emp.employee_id })
      )
    );
    // wait for batch
    // eslint-disable-next-line no-await-in-loop
    const settled = await Promise.all(promises);
    for (const s of settled) {
      if (s.ok) results.sent++;
      else results.failed.push({ employee_id: s.employee_id, error: s.error });
    }
  }

  return results;
}

module.exports = { getDashboardStatus, sendMissingDaysNotification, sendNotificationsToAll };
