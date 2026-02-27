import { apiRateLimit, auditLog } from "../../../lib/api-security";
// Aureus Social Pro — API v1 Declarations
// Generate DmfA, Dimona, Belcotax, SEPA XML via REST API

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function GET(request) {
  return Response.json({
    declarations: {
      dmfa: { method: 'POST', description: 'Generate DmfA ONSS XML (quarterly)', body: '{ quarter: 1-4, year: int, company: {}, employees: [] }' },
      dimona: { method: 'POST', description: 'Generate Dimona XML (IN/OUT)', body: '{ employee: {}, type: IN|OUT, company: {} }' },
      belcotax: { method: 'POST', description: 'Generate Belcotax 281.10 XML (yearly)', body: '{ year: int, company: {}, employees: [] }' },
      sepa: { method: 'POST', description: 'Generate SEPA pain.001 XML', body: '{ company: {}, payments: [{ name, iban, bic, amount }] }' },
    },
    note: 'All XML responses include Content-Type: application/xml with Content-Disposition for download',
  }, { headers: cors() });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!type) return Response.json({ error: 'Missing declaration type (dmfa, dimona, belcotax, sepa)' }, { status: 400, headers: cors() });

    switch (type) {
      case 'dmfa':
        return generateDmfAResponse(body);
      case 'dimona':
        return generateDimonaResponse(body);
      case 'belcotax':
        return generateBelcotaxResponse(body);
      case 'sepa':
        return generateSEPAResponse(body);
      default:
        return Response.json({ error: `Unknown declaration type: ${type}. Use dmfa, dimona, belcotax, or sepa.` }, { status: 400, headers: cors() });
    }
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors() });
  }
}

function generateDmfAResponse(body) {
  const { quarter, year, company = {}, employees = [] } = body;
  if (!quarter || !year) return Response.json({ error: 'Missing quarter or year' }, { status: 400, headers: cors() });

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const onssNr = (company.onss || '000-0000000-00').replace(/[^0-9]/g, '');
  const filename = `FI.DMFA.${onssNr}.${date}.00001.R.1.1.xml`;

  let workersXml = '';
  for (const emp of employees) {
    const brut = +(emp.monthlySalary || emp.brut || emp.salary || 0);
    const isOuvrier = (emp.statut || 'employe') === 'ouvrier';
    const base = isOuvrier ? brut * 1.08 : brut;
    const onssW = Math.round(base * 0.1307 * 100) / 100;
    const quarterly = brut * 3;

    workersXml += `
    <WorkerRecord>
      <WorkerIdentification>
        <INSS>${emp.niss || '00000000000'}</INSS>
        <Name>${emp.last || emp.nom || ''}</Name>
        <FirstName>${emp.first || emp.prenom || ''}</FirstName>
      </WorkerIdentification>
      <OccupationRecord seq="1">
        <JointCommission>${emp.cp || '200'}</JointCommission>
        <WorkerStatus>${isOuvrier ? '1' : '2'}</WorkerStatus>
        <MeanWeekHours>${emp.whWeek || 38.00}</MeanWeekHours>
        <ServiceRecord code="001">
          <NbrDays>${13 * 5}</NbrDays>
          <NbrHours>${13 * (emp.whWeek || 38)}</NbrHours>
        </ServiceRecord>
        <RemunRecord code="001"><Amount>${quarterly.toFixed(2)}</Amount></RemunRecord>
        ${isOuvrier ? `<RemunRecord code="010"><Amount>${(quarterly * 1.08).toFixed(2)}</Amount></RemunRecord>` : ''}
      </OccupationRecord>
      <ContributionWorkerRecord>
        <Base>${(base * 3).toFixed(2)}</Base>
        <Rate>13.07</Rate>
        <Amount>${(onssW * 3).toFixed(2)}</Amount>
      </ContributionWorkerRecord>
    </WorkerRecord>`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<FormCreation xmlns="http://www.smals-mvm.be/xml/ns/systemFlux">
  <FormType>DMFA</FormType>
  <CreationDate>${new Date().toISOString()}</CreationDate>
  <Reference>${filename}</Reference>
  <EmployerDeclaration>
    <ONSSNumber>${onssNr}</ONSSNumber>
    <CompanyID>${company.vat || ''}</CompanyID>
    <Quarter>${quarter}</Quarter>
    <Year>${year}</Year>
    <WorkerCount>${employees.length}</WorkerCount>
    ${workersXml}
  </EmployerDeclaration>
</FormCreation>`;

  return new Response(xml, {
    headers: { ...cors(), 'Content-Type': 'application/xml', 'Content-Disposition': `attachment; filename="${filename}"` },
  });
}

function generateDimonaResponse(body) {
  const { employee = {}, type: dimonaType = 'IN', company = {} } = body;
  if (!dimonaType) return Response.json({ error: 'Missing type (IN or OUT)' }, { status: 400, headers: cors() });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DimonaDeclaration xmlns="http://www.smals-mvm.be/xml/ns/systemFlux">
  <DeclarationType>${dimonaType}</DeclarationType>
  <CreationDate>${new Date().toISOString()}</CreationDate>
  <Employer>
    <ONSSNumber>${(company.onss || '').replace(/[^0-9]/g, '')}</ONSSNumber>
    <CompanyName>${company.name || ''}</CompanyName>
  </Employer>
  <Worker>
    <INSS>${employee.niss || ''}</INSS>
    <LastName>${employee.last || employee.nom || ''}</LastName>
    <FirstName>${employee.first || employee.prenom || ''}</FirstName>
    <StartDate>${employee.startDate || new Date().toISOString().slice(0, 10)}</StartDate>
    ${dimonaType === 'OUT' ? `<EndDate>${employee.endDate || new Date().toISOString().slice(0, 10)}</EndDate>` : ''}
    <JointCommission>${employee.cp || '200'}</JointCommission>
    <WorkerType>${(employee.statut || 'employe') === 'ouvrier' ? 'OTH' : 'BCW'}</WorkerType>
  </Worker>
</DimonaDeclaration>`;

  return new Response(xml, {
    headers: { ...cors(), 'Content-Type': 'application/xml', 'Content-Disposition': `attachment; filename="DIMONA-${dimonaType}-${Date.now()}.xml"` },
  });
}

function generateBelcotaxResponse(body) {
  const { year, company = {}, employees = [] } = body;
  if (!year) return Response.json({ error: 'Missing year' }, { status: 400, headers: cors() });

  let opgaven = '';
  employees.forEach((emp, i) => {
    const brut = +(emp.monthlySalary || emp.brut || 0) * 12;
    const onssAnnuel = Math.round(brut * 0.1307 * 100) / 100;
    opgaven += `
    <Opgave nr="${i + 1}">
      <Verkrijger>
        <INSZ>${emp.niss || ''}</INSZ>
        <Naam>${emp.last || ''}</Naam>
        <Voornaam>${emp.first || ''}</Voornaam>
      </Verkrijger>
      <Bezoldiging>
        <Lonen>${brut.toFixed(2)}</Lonen>
        <RIZIV>${onssAnnuel.toFixed(2)}</RIZIV>
      </Bezoldiging>
    </Opgave>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Verzending xmlns="urn:belcotax:${year}">
  <Aangifte>
    <Schuldenaar>
      <KBO>${(company.vat || '').replace(/[^0-9]/g, '')}</KBO>
      <Naam>${company.name || ''}</Naam>
    </Schuldenaar>
    <Aangiftetype>28110</Aangiftetype>
    <AangifteJaar>${year}</AangifteJaar>
    <AantalOpgaven>${employees.length}</AantalOpgaven>
    ${opgaven}
  </Aangifte>
</Verzending>`;

  return new Response(xml, {
    headers: { ...cors(), 'Content-Type': 'application/xml', 'Content-Disposition': `attachment; filename="BELCOTAX-281.10-${year}.xml"` },
  });
}

function generateSEPAResponse(body) {
  const { company = {}, payments = [] } = body;
  const msgId = 'AUREUS-' + Date.now();
  const totalAmount = payments.reduce((a, p) => a + (p.amount || 0), 0);

  let txs = '';
  payments.forEach(p => {
    txs += `
      <CdtTrfTxInf>
        <PmtId><EndToEndId>${p.ref || 'SAL-' + Date.now()}</EndToEndId></PmtId>
        <Amt><InstdAmt Ccy="EUR">${(p.amount || 0).toFixed(2)}</InstdAmt></Amt>
        <CdtrAgt><FinInstnId><BIC>${p.bic || 'GEBABEBB'}</BIC></FinInstnId></CdtrAgt>
        <Cdtr><Nm>${p.name || ''}</Nm></Cdtr>
        <CdtrAcct><Id><IBAN>${(p.iban || '').replace(/\s/g, '')}</IBAN></Id></CdtrAcct>
        <RmtInf><Ustrd>${p.communication || 'Salaire'}</Ustrd></RmtInf>
      </CdtTrfTxInf>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${payments.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty><Nm>${company.name || 'Aureus Social Pro'}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${msgId}-001</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${payments.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl></PmtTpInf>
      <ReqdExctnDt>${new Date().toISOString().slice(0, 10)}</ReqdExctnDt>
      <Dbtr><Nm>${company.name || ''}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${(company.iban || '').replace(/\s/g, '')}</IBAN></Id></DbtrAcct>
      <DbtrAgt><FinInstnId><BIC>${company.bic || 'GEBABEBB'}</BIC></FinInstnId></DbtrAgt>
      ${txs}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

  return new Response(xml, {
    headers: { ...cors(), 'Content-Type': 'application/xml', 'Content-Disposition': `attachment; filename="SEPA-pain.001-${Date.now()}.xml"` },
  });
}
