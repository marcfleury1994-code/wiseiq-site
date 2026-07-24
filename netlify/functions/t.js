/**
 * WiseIQ Telemetry Relay — Netlify Function
 * ─────────────────────────────────────────────────────────────────
 * Endpoint: POST /t
 *
 * Receives behavioral event payloads from wiq-telemetry.js and
 * forwards them to the GA4 Measurement Protocol with the API Secret
 * added server-side (never exposed to the browser).
 *
 * Environment variables required (set in Netlify UI > Site Settings > Environment):
 *   GA4_API_SECRET     — from GA4 Admin > Data Streams > Measurement Protocol API secrets
 *
 * The GA4 Measurement ID is sent by the client in the request body
 * (read from the existing gtag snippet on the page — not a secret).
 *
 * GA4 Measurement Protocol endpoint:
 *   https://www.google-analytics.com/mp/collect?measurement_id=G-XXXXXXXX&api_secret=XXXXXXXX
 */

exports.handler = async function (event) {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // API Secret from environment (never sent to browser)
  var apiSecret = process.env.GA4_API_SECRET;
  if (!apiSecret) {
    // Fail silently — don't expose missing config to client
    return { statusCode: 204, body: '' };
  }

  var body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  var measurementId = body.measurement_id;
  var clientId = body.client_id;
  var events = body.events;

  if (!measurementId || !clientId || !events || !events.length) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  // Validate measurement ID format (G-XXXXXXXXXX)
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) {
    return { statusCode: 400, body: 'Invalid measurement_id format' };
  }

  // Build GA4 Measurement Protocol payload
  var ga4Payload = JSON.stringify({
    client_id: clientId,
    events: events.map(function (evt) {
      return {
        name: evt.name,
        params: Object.assign({}, evt.params, {
          // Ensure engagement_time_msec is set (required for events to appear in reports)
          engagement_time_msec: evt.params.engagement_time_msec || 100
        })
      };
    })
  });

  var ga4Url = 'https://www.google-analytics.com/mp/collect' +
    '?measurement_id=' + encodeURIComponent(measurementId) +
    '&api_secret=' + encodeURIComponent(apiSecret);

  try {
    var response = await fetch(ga4Url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: ga4Payload
    });

    // GA4 MP returns 204 on success, 400 on bad payload
    if (response.status === 204 || response.status === 200) {
      return {
        statusCode: 204,
        body: '',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      };
    } else {
      // Log for debugging but don't expose to client
      console.error('[WIQ Relay] GA4 error:', response.status, await response.text());
      return { statusCode: 204, body: '' }; // Still return 204 to client
    }
  } catch (err) {
    console.error('[WIQ Relay] Fetch error:', err.message);
    return { statusCode: 204, body: '' }; // Fail silently
  }
};
