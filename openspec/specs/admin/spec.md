# Domain: Admin Panel

## Source
- Admin: `C:\Projects\Punto-Park-U-Web\Administrador\`
  - `Admi.html`, `Admi.css`, `Admi.js`
- Panel: `C:\Projects\Punto-Park-U-Web\Administrador\Panel\`
  - `PanelAdmi.html`, `panel.css`, `panel.js`, `modules.js`

## Features
1. **Admin Dashboard** — Statistics overview, charts, recent activity
2. **Parking Management** — View/update parking spots, occupancy
3. **User Management** — View registered users, their vehicles
4. **Tariff Management** — Update pricing per vehicle type
   - Persisted to localStorage in vanilla → MongoDB in migration
5. **Schedule Management** — Update operating hours
   - Persisted to localStorage in vanilla → MongoDB in migration
6. **Reports** — Generate PDF/Excel exports
7. **Real-time Monitoring** — Live occupancy updates

## Migration Notes
- Replace localStorage with MongoDB-backed API calls
- Implement Chart.js for dashboard visualizations
- Create modular React components for each panel section
- Add export functionality as service layer
- Use React Router for sub-navigation within admin panel
- Protect all admin routes with auth guard
