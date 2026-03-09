# Sidebar icon sprites

Place PNG sprites here to use custom sidebar icons. Each file should be **40×20 px** (two 20×20 icons side by side):

- **Left half** = normal state  
- **Right half** = active state (e.g. cyan glow)

Required filenames:

- `reports.png`
- `breaks-report.png`
- `attendance-report.png`
- `leads.png`
- `employees.png`
- `teams.png`
- `affiliator.png`

If a file is missing, that menu item will show an empty icon until the file is added. To enable PNG sprites, set `USE_SIDEBAR_PNG_SPRITES = true` in `widgets/side-bar/ui/SideBar/SideBar.tsx`.
