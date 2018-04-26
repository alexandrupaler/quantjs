function parseUnscheduledGateString(gate)
{
    var ret = {};

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

function parseScheduledGateString(gate)
{
    var ret = {};

    var command = gate.split("@");
    var commandSplits = command[1].split(" ");
    ret.timeStep = Number(command[0]);
    ret.gateType = commandSplits[0];
    ret.wires = new Array();
    for(var i=1; i<commandSplits.length; i++)
    {
        ret["wires"].push(Number(commandSplits[i]));
    }
    ret.isComment = (commandSplits[0][0] == '%');

    return ret;
}
