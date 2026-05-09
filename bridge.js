const mqtt = require('mqtt');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://oravkfploatazeetraik.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYXZrZnBsb2F0YXplZXRyYWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDExNzEsImV4cCI6MjA5MTkxNzE3MX0.DIp4i6v2XtwS1FlkYMKLM5oZJelL7cNMww8sojhSUi0'
);

const MQTT_THRESHOLD = 0.02;       // must be above this to save
const MIN_INTERVAL_MS = 10000;     // max once every 10 seconds

const mqttClient = mqtt.connect('mqtts://99b1073715694d9e876a4f587a4013f5.s1.eu.hivemq.cloud:8883', {
  username: 'QuakeLight',
  password: 'CvSU2026'
});

let latest = {};
let lastInsertTime = 0;

mqttClient.on('connect', () => {
  console.log('Connected to HiveMQ');
  mqttClient.subscribe(['quake/log', 'quake/state', 'quake/buzzer', 'quake/led', 'quake/battery']);
});

mqttClient.on('message', (topic, message) => {
  const key = topic.replace('quake/', '');
  latest[key] = message.toString();
});

setInterval(async () => {
  if (!latest.log)          return;
  if (latest.state !== '1') return;

  const pga = parseFloat(latest.log);

  if (isNaN(pga))            return;
  if (pga < MQTT_THRESHOLD)  return;  // ← THE FIX: ignore anything below threshold
  if (Date.now() - lastInsertTime < MIN_INTERVAL_MS) return;

  const { error } = await supabase
    .from('readings')
    .insert({
      pga:      pga,
      eq_state: true,
      buzzer:   latest.buzzer === '1',
      led:      latest.led    === '1',
      battery:  parseFloat(latest.battery),
    });

  if (error) {
    console.error('Supabase error:', error.message);
  } else {
    lastInsertTime = Date.now();
    console.log('Saved — PGA:', pga);
  }

}, 1000);
