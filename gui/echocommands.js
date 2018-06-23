function EchoCommands(toolparams)
{
    this.toolParameters = toolparams;
    this.gateList = [];
}

EchoCommands.prototype.clear = function(elementId)
{
    var txtField = this.toolParameters.textAreas[elementId];
    txtField.value = "";
}

EchoCommands.prototype.echo = function(msg, elementId)
{
   var txtField = null;
   if(elementId == undefined)
   {
       txtField = this.toolParameters.textAreas["circuit"];
   }
   else
   {
       txtField = this.toolParameters.textAreas[elementId];
   }

   if(msg == undefined)
   {
       txtField.value = "";
   }
   else
   {
       txtField.value += msg + "\n";
   }

   //aici adauga la gateList
   if(msg != undefined && elementId == undefined && msg[0] != '#')
   {
       //if not the default (circuit) then do not add to gateList
       this.gateList.push(msg);
   }
}
