// SELF-DESTRUCTING SERVICE WORKER
// This exists solely to replace the broken one and clean up.

self.addEventListener('install', (event) => {
    console.log('💥 KILL SWITCH: Installing new SW to replace broken one...');
    self.skipWaiting(); // Force this new SW to become active immediately
});

self.addEventListener('activate', (event) => {
    console.log('💥 KILL SWITCH: Activating & Unregistering...');

    event.waitUntil(
        self.registration.unregister().then(() => {
            return self.clients.matchAll();
        }).then((clients) => {
            clients.forEach(client => client.navigate(client.url)); // Refresh page
        })
    );
});
