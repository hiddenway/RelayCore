self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/logo.svg",
      badge: data.badge || "/logo.svg",
      tag: data.tag,
      data: data.data,
      requireInteraction: false,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const slug = event.notification.data?.routeSlug;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      if (list.length > 0) {
        const win = list[0];
        if (slug) win.navigate(`/logs`);
        return win.focus();
      }
      return clients.openWindow(slug ? `/logs` : "/dashboard");
    })
  );
});
