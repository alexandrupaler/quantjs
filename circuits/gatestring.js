/**
 * Like a constructor, but code is not OO for the moment
 */
function constructEmptyUnscheduledGate()
{
    var ret = {};
    ret.deltaTime = -1;
    ret.gateType = "";
    ret.wires = [];

    return ret;
}

function parseUnscheduledGateString(gate)
{
    var ret = constructEmptyUnscheduledGate();

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

function toStringUnscheduledGate(gate)
{
    var ret = "";

    ret += gate.gateType;
    for(var i=0; i<gate.wires.length; i++)
    {
        ret += " " + gate.wires[i];
    }
    ret += "|" + gate.deltaTime;

    return ret;
}

/**
 * Like a constructor, but code is not OO for the moment
 */
function constructEmptyScheduledGate()
{
    var ret = {};
    ret.isComment = false;
    ret.timeStep = -1;
    ret.gateType = "";
    ret.wires = [];

    return ret;
}

function parseScheduledGateString(gate)
{
    var ret = constructEmptyScheduledGate();

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

function toStringScheduledGate(gate)
{
    var ret = "";
    if(ret.isComment)
        ret = "%";

    ret += gate.timeStep + "@";
    ret += gate.gateType;
    for(var i=0; i<gate.wires.length; i++)
    {
        ret += " " + gate.wires[i];
    }

    return ret;
}

/**
 *
 */
/**
 * Like a constructor, but code is not OO for the moment
 */
function constructEmptyTemplateGate()
{
    var ret = {};
    ret.gateType = "";
    ret.wires = [];

    return ret;
}

function parseTemplateGateString(gate)
{
    var ret = constructEmptyTemplateGate();

    var commandSplits = gate.split(" ");
    ret.gateType = commandSplits[0];
    ret.wires = new Array();
    for(var i=1; i<commandSplits.length; i++)
    {
        ret["wires"].push(Number(commandSplits[i]));
    }

    return ret;
}
