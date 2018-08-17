function Tabs()
{

}

Tabs.openTab = function(evt, tabName, tabGroupPrefix) 
{
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) 
    {
        if(tabcontent[i].id.startsWith(tabGroupPrefix))
        {
            tabcontent[i].style.display = "none";
        }
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++)
    {
        if(tablinks[i].id.startsWith(tabGroupPrefix))
        {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

Tabs.getOpenTabButton = function(tabGroupPrefix)
{
    // Get all elements with class="tablinks" and return one that is "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++)
    {
        if(tablinks[i].id.startsWith(tabGroupPrefix))
        {
            if(tablinks[i].className.includes("active"))
            {
                return tablinks[i].id;
            }
        }
    }

    return undefined;
}