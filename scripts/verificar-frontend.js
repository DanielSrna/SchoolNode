#!/usr/bin/env node
// ============================================================
// Verificación del frontend: comprueba que los estilos y scripts
// se sirvan correctamente y que las firmas SRI (integrity)
// coincidan con el contenido real, tal como lo haría un navegador.
//
// Uso: npm run check:frontend
// ============================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Entorno aislado ANTES de cargar la app (igual que los tests)
process.env.JWT_SECRET = 'verify_secret';
process.env.JWT_REFRESH_SECRET = 'verify_refresh_secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_replace_with_real_key';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_replace_with_real_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_replace_with_real_secret';
process.env.APP_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

const RESULTADOS = [];
let FALLOS = 0;

const ok = (msg) => RESULTADOS.push(`  ✔ ${msg}`);
const fail = (msg) => {
  RESULTADOS.push(`  ✖ ${msg}`);
  FALLOS++;
};

const sha384 = (buffer) =>
  'sha384-' + crypto.createHash('sha384').update(buffer).digest('base64');

(async () => {
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // 1. La página de login se sirve
    const resLogin = await fetch(`${base}/login`);
    const html = await resLogin.text();
    ok(`GET /login -> HTTP ${resLogin.status}`);

    // 2. Extraer todos los recursos locales (CSS y JS)
    const recursos = [];
    for (const tag of html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)) {
      const href = tag[0].match(/href="([^"]+)"/)?.[1];
      if (href && href.startsWith('/')) {
        recursos.push({ href, integ: tag[0].match(/integrity="([^"]+)"/)?.[1] || null });
      }
    }
    for (const tag of html.matchAll(/<script[^>]*src="([^"]+)"[^>]*>/g)) {
      const href = tag[1];
      if (href.startsWith('/')) {
        recursos.push({ href, integ: tag[0].match(/integrity="([^"]+)"/)?.[1] || null });
      }
    }
    ok(`${recursos.length} recursos locales encontrados en /login`);

    // 3. Descargar cada recurso y verificar su integridad
    for (const { href, integ } of recursos) {
      const res = await fetch(`${base}${href}`);
      if (res.status !== 200) {
        fail(`${href} -> HTTP ${res.status}`);
        continue;
      }
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.byteLength === 0) {
        fail(`${href} -> archivo vacío`);
        continue;
      }
      if (integ) {
        const calculado = sha384(bytes);
        if (calculado === integ) {
          ok(`${href} -> integridad OK (${bytes.byteLength} bytes)`);
        } else {
          fail(
            `${href} -> integrity NO coincide\n` +
              `      esperado : ${integ}\n` +
              `      calculado: ${calculado}`
          );
        }
      } else {
        ok(`${href} -> servido (${bytes.byteLength} bytes)`);
      }
    }

    // 4. Ninguna vista debe depender de la CDN de Bootstrap
    const vistas = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (p.endsWith('.ejs')) vistas.push(p);
      }
    };
    walk(path.join(__dirname, '..', 'src', 'views'));

    let conCdn = 0;
    for (const vista of vistas) {
      const contenido = fs.readFileSync(vista, 'utf8');
      if (contenido.includes('cdn.jsdelivr.net/npm/bootstrap')) {
        conCdn++;
        fail(`${path.relative(process.cwd(), vista)} -> aún usa CDN de Bootstrap`);
      }
    }
    if (conCdn === 0) ok(`${vistas.length} vistas sin dependencia de CDN`);

    // 5. styles.css local bien balanceado
    const rutaCss = path.join(__dirname, '..', 'src', 'public', 'css', 'styles.css');
    const css = fs.readFileSync(rutaCss, 'utf8');
    const abre = (css.match(/{/g) || []).length;
    const cierra = (css.match(/}/g) || []).length;
    if (abre === cierra) ok(`styles.css balanceado (${abre} bloques)`);
    else fail(`styles.css desbalanceado: { ${abre} vs } ${cierra}`);

    // 6. Scripts del header presentes y referenciados (modo oscuro, notificaciones)
    const header = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'views', 'partials', 'header.ejs'),
      'utf8'
    );
    for (const script of ['dark-mode.js', 'notificaciones.js', 'auth-manager.js']) {
      const existe = fs.existsSync(
        path.join(__dirname, '..', 'src', 'public', 'js', script)
      );
      if (!existe) {
        fail(`Falta el archivo src/public/js/${script}`);
        continue;
      }
      if (header.includes(`/js/${script}`)) {
        ok(`${script} presente y referenciado en el header`);
      } else {
        fail(`${script} existe pero no está referenciado en partials/header.ejs`);
      }
    }
  } catch (error) {
    fail('Error general: ' + error.message);
  } finally {
    server.close();
  }

  console.log('=== Verificación del frontend ===');
  console.log(RESULTADOS.join('\n'));
  console.log(
    FALLOS === 0
      ? '\nRESULTADO: OK - los estilos se sirven correctamente'
      : `\nRESULTADO: ${FALLOS} FALLO(S) - revisar lo marcado con ✖`
  );
  process.exit(FALLOS === 0 ? 0 : 1);
})();
