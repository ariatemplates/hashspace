This example shows how a simple tab component can be implemented:

[#output]

A fews things can be noted here:

 - the *$init()* methods of the *tab* controllers are called after the *init()* of the tabbar - as such the *selected* property of a tab may be already set before the tab is initialized.
 - the selected tab can be referenced as a controller property - cf *selectedTab* and then directly referenced in the tabbar template: `<#ctrl.selectedTab.body/>`
