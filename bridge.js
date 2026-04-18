const mqtt = require('mqtt');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://oravkfploatazeetraik.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYXZrZnBsb2F0YXplZXRyYWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDExNzEsImV4cCI6MjA5MTkxNzE3MX0.DIp4i6v2XtwS1FlkYMKLM5oZJelL7cNMww8sojhSUi0'   // paste your reset key here
);

const mqttClient = mqtt.connect('mqtts://99b1073715694d9e876a4f587a4013f5.s1.eu.hivemq.cloud:8883', {
  username: 'QuakeLight',
  password: 'CvSU2026'
});

let latest = {};

mqttClient.on('connect', () => {
  console.log('Connected to HiveMQ');
  mqttClient.subscribe(['quake/log', 'quake/state', 'quake/buzzer', 'quake/led']); // ← quake/log instead of quake/pga
});

mqttClient.on('message', (topic, message) => {
  const key = topic.replace('quake/', '');
  latest[key] = message.toString();
});

setInterval(async () => {
  console.log('latest:', latest);  // ← add this to see what's being received

  if (!latest.log) return;
  if (latest.state !== '1') return;

  const { error } = await supabase
    .from('readings')
    .insert({
      pga:      parseFloat(latest.log),
      eq_state: true,
      buzzer:   latest.buzzer === '1',
      led:      latest.led === '1',
    });

  if (error) console.error('Supabase error:', error.message);
  else console.log('Saved — PGA:', latest.log);

}, 1000);