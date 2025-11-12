export function make_menu(Menu) {

    const template = [
        ...(process.platform === 'darwin'
            ? [{ role: 'appMenu' }]
            : []),
        { role: 'fileMenu' },
        { role: 'editMenu' },
        { role: 'viewMenu' },
        { role: 'windowMenu' },
        {
            role: 'Test',
            submenu: [
                {
                    label: 'Learn More',
                    click: () => {
                        console.log("clicked");
                    }
                }
            ]
        }
    ]

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}