/**
 * Like a constructor, but code is not OO for the moment
 */

function UnscheduledGate()
{
    this.deltaTime = -1;
    this.gateType = "";
    this.wires = [];
}

UnscheduledGate.parseUnscheduledGateString = function(gate)
{
    // var ret = constructEmptyUnscheduledGate();
    var ret = new UnscheduledGate();

    var command = gate.split("|");
    var commandSplits = command[0].split(" ");
    ret.deltaTime = Number(command[1]);
    ret.gateType = commandSplits[0];
    ret.wires = new Array();
    for(var i=1; i<commandSplits.length; i++)
    {
        ret["wires"].push(Number(commandSplits[i]));
    }

    return ret;
}

UnscheduledGate.prototype.toString = function()
{
    var ret = "";

    ret += this.gateType;
    for(var i=0; i<this.wires.length; i++)
    {
        ret += " " + this.wires[i];
    }
    ret += "|" + this.deltaTime;

    return ret;
}

function ScheduledGate()
{
    this.isComment = false;
    this.timeStep = -1;
    this.gateType = "";
    this.wires = [];
}

ScheduledGate.parseScheduledGateString = function(gate)
{
    var ret = new ScheduledGate();

    var command = gate.split("@");
    ret.isComment = (command[0][0] == '%');
    if(ret.isComment)
    {
        command[0] = command[0].slice(1);
    }

    var commandSplits = command[1].split(" ");
    ret.timeStep = Number(command[0]);
    ret.gateType = commandSplits[0];
    ret.wires = new Array();
    for(var i=1; i<commandSplits.length; i++)
    {
        ret["wires"].push(Number(commandSplits[i]));
    }

    return ret;
}

ScheduledGate.prototype.toString = function()
{
    var ret = "";
    if(ret.isComment)
        ret = "%";

    ret += this.timeStep + "@";
    ret += this.gateType;
    for(var i=0; i<this.wires.length; i++)
    {
        ret += " " + this.wires[i];
    }

    return ret;
}

function TemplateGate()
{
    this.gateType = "";
    this.wires = [];
}

TemplateGate.parseTemplateGateString = function(gate)
{
    var ret = new TemplateGate();

    var commandSplits = gate.split(" ");
    ret.gateType = commandSplits[0];
    ret.wires = new Array();
    for(var i=1; i<commandSplits.length; i++)
    {
        ret["wires"].push(Number(commandSplits[i]));
    }

    return ret;
}
