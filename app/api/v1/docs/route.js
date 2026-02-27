import { apiRateLimit, auditLog } from "../../../lib/api-security";
// Aureus Social Pro — API v1 Documentation
// GET /api/v1/docs → Interactive API reference

export async function GET() {
  const docs = {
    api: 'Aureus Social Pro — REST API v1',
    version: '1.0.0',
    base_url: '/api/v1',
    auth: {
      type: 'Bearer Token (Supabase JWT)',
      header: 'Authorization: Bearer <token>',
      note: 'Obtain token via POST /api/v1/auth/login or Supabase client auth',
    },
    rate_limit: '100 requests/minute per API key',
    endpoints: {
      employees: {
        'GET /api/v1/employees': {
          description: 'List all employees for the authenticated tenant',
          params: { page: 'int (default 1)', limit: 'int (default 50, max 200)', status: 'active|inactive|all', search: 'string (name, NISS, email)' },
          response: '{ data: Employee[], total: int, page: int }',
        },
        'GET /api/v1/employees/:id': {
          description: 'Get single employee details',
          response: '{ data: Employee }',
        },
        'POST /api/v1/employees': {
          description: 'Create a new employee',
          body: '{ first: string, last: string, niss: string, email?: string, salary: number, contractType: CDI|CDD, startDate: ISO8601, cp: string }',
          response: '{ data: Employee, id: string }',
        },
        'PUT /api/v1/employees/:id': {
          description: 'Update employee',
          body: '{ ...partial Employee fields }',
          response: '{ data: Employee }',
        },
        'DELETE /api/v1/employees/:id': {
          description: 'Soft-delete employee (mark inactive)',
          response: '{ success: true }',
        },
      },
      payroll: {
        'POST /api/v1/payroll/calculate': {
          description: 'Calculate payslip for one employee',
          body: '{ employeeId: string, month: int (1-12), year: int, brut?: number }',
          response: '{ brut, onssW, onssE, imposable, precompte, csss, bonusEmploi, net, coutTotal, details: {} }',
        },
        'POST /api/v1/payroll/batch': {
          description: 'Calculate payslips for all employees of a client',
          body: '{ clientId: string, month: int, year: int }',
          response: '{ data: Payslip[], summary: { totalBrut, totalNet, totalCout, count } }',
        },
        'GET /api/v1/payroll/history': {
          description: 'Get payroll history',
          params: { clientId: 'string', from: 'ISO8601', to: 'ISO8601' },
          response: '{ data: PayrollRun[] }',
        },
      },
      declarations: {
        'POST /api/v1/declarations/dmfa': {
          description: 'Generate DmfA XML for a quarter',
          body: '{ clientId: string, quarter: 1-4, year: int }',
          response: '{ xml: string, filename: string, workers: int }',
          content_type: 'application/xml',
        },
        'POST /api/v1/declarations/dimona': {
          description: 'Generate Dimona XML (IN/OUT)',
          body: '{ employeeId: string, type: IN|OUT, date?: ISO8601 }',
          response: '{ xml: string, filename: string }',
        },
        'POST /api/v1/declarations/belcotax': {
          description: 'Generate Belcotax 281.10 XML',
          body: '{ clientId: string, year: int }',
          response: '{ xml: string, filename: string, fiches: int }',
        },
        'POST /api/v1/declarations/sepa': {
          description: 'Generate SEPA pain.001 XML for salary payments',
          body: '{ clientId: string, month: int, year: int }',
          response: '{ xml: string, filename: string, totalAmount: number, payments: int }',
        },
      },
      webhooks: {
        'GET /api/webhooks': {
          description: 'List available webhook events',
          response: '{ events: string[] }',
        },
        'POST /api/webhooks': {
          description: 'Send webhook notification',
          body: '{ event: string, data: object, webhookUrl: string, secret?: string }',
          response: '{ delivered: boolean, status: int }',
          note: 'Signature: HMAC-SHA256 in X-Aureus-Signature header',
        },
      },
    },
    models: {
      Employee: {
        id: 'string (UUID)',
        first: 'string',
        last: 'string',
        niss: 'string (11 digits)',
        email: 'string',
        iban: 'string (BE + 14 digits)',
        monthlySalary: 'number',
        contractType: 'CDI | CDD | INTERIM | STUDENT | FLEXI',
        startDate: 'ISO8601',
        endDate: 'ISO8601 | null',
        cp: 'string (commission paritaire)',
        status: 'active | inactive',
        whWeek: 'number (hours/week, default 38)',
        regime: 'full | half',
        statut: 'employe | ouvrier',
      },
      Payslip: {
        employeeId: 'string',
        period: '{ month: int, year: int }',
        brut: 'number',
        onssWorker: 'number (13.07%)',
        onssEmployer: 'number (25.07%)',
        imposable: 'number',
        precompte: 'number',
        csss: 'number',
        bonusEmploi: 'number',
        net: 'number',
        coutTotal: 'number',
      },
    },
    errors: {
      400: 'Bad Request — Invalid parameters',
      401: 'Unauthorized — Missing or invalid token',
      403: 'Forbidden — Insufficient permissions or IP blocked',
      404: 'Not Found — Resource does not exist',
      429: 'Too Many Requests — Rate limit exceeded',
      500: 'Internal Server Error',
    },
    changelog: [
      { version: '1.0.0', date: '2026-02-26', changes: 'Initial API release — employees, payroll, declarations' },
    ],
  };

  return Response.json(docs, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
