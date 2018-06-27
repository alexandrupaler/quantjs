function GatePlacer(toolparams)
{
    this.echoCommands = new EchoCommands(toolparams);
}

GatePlacer.prototype.writeFileHeader = function(nrvars, where)
{
    //clear
    // this.echoCommands.clear(where);
    this.echoCommands.echo(undefined, where);

    //write header
    this.echoCommands.echo(".nrVars " + nrvars, where);
    this.echoCommands.echo("in " + "-".repeat(nrvars), where);
    this.echoCommands.echo("out " + "-".repeat(nrvars), where);
}

/*
  Used for H, P, V etc. but not directly T
*/
GatePlacer.prototype.placeGate = function(type, qubits, delay)
{
    if (! (qubits instanceof Array))
        this.echoCommands.echo("placeGate qubits is not Array!");

    if(qubits.length == 0)
        this.echoCommands.echo("ERROR: placeCX qubits zero length!");

    var msg = type + "";
    for(var i=0; i<qubits.length; i++)
    {
        msg += " " + qubits[i];
    }

    /*
    add time delta
     */
    var tmpDelay = 0;
    if(delay != undefined)
        tmpDelay = delay;
    msg += "|" + tmpDelay;//no delta for the moment

    this.echoCommands.echo(msg);
}

GatePlacer.prototype.placeControlledRotationXGate = function(piFraction, controls, targets, delay)
{
    var type2 = "Z_" + controls.length + "_" + targets.length + "_" + piFraction;

    var qubits = controls.concat(targets);

    this.placeGate(type2, qubits, delay);
}

/*
  Used for T gate
*/
GatePlacer.prototype.placeT = function(correct, qubits, delay)
{
    this.placeGate("t", qubits, delay);
    if(correct)
        this.placeGate("p", qubits, delay);
}

GatePlacer.prototype.placeK = function(ka, kb, kt, decompose, delay)
{
    if(decompose == 1)
    {
        this.placeGate("ix", [ kt ], delay);
        //this T gate is a direct link from the distillation box
        //placeT(false, [ kt ] );//do not place the T gate, because of the direct link placeholder
        this.placeCX(ka, [ kt ]);
        this.placeCX(kb, [ kt ]);
        this.placeCX(kt, [ kb, ka ]);
        /*
            This is the classic decomposition from the Gidney paper
        //placeT(true, [ka, kb, kt]);
        //placeCX(kt, [ kb, ka ]);
        //placeGate("h", [ kt ] );
        //placeGate("p", [ kt ]);
        */
        //Replaced the last correction with SHS=V\dagger
        this.placeT(true, [ka, kb]);
        this.placeT(false, [ kt ], -1);
        this.placeCX(kt, [ kb, ka ]);
        this.placeGate("v", [ kt ]);
    }
    else if(decompose == 2)
    {
        this.placeGate("ix", [ kt ], delay);
        this.placeCX(kb, [kt]);
        this.placeT(true, [kt], 0);
        this.placeCX(ka, [kt]);
        this.placeT(true, [kt], 0);
        this.placeCX(kb, [kt]);
        this.placeT(true, [kt], 0);
        this.placeGate("h", [kt]);
        this.placeGate("p", [kt]);
    }
    else
    {
        //echo ("K " + ka + " " + kb + " " + kt);
        this.placeGate("K", [ka, kb, kt], 0);
    }
}

GatePlacer.prototype.placeU = function(ka, kb, kt, decompose, delay)
{
    if(decompose == 1)
    {
        this.placeGate ("mx", [ kt ], delay);
        this.placeCZ(kb, [ ka ], true, -1);
    }
    else if(decompose == 2)
    {
        this.placeGate ("mx", [ kt ], delay);
        this.placeCZ(ka, [ kb ], true, -1);
    }
    else if(decompose == 3)
    {
        this.placeCX(kb, [kt], delay);
        this.placeGate ("mx", [ kb ]);
        this.placeCX(ka, [kt]);
    }
    else
    {
        this.placeGate ("U", [ka, kb, kt], 0);
    }
}

GatePlacer.prototype.placeCZ = function(control, targets, decompose, delay)
{
    if(decompose)
    {
        this.placeGate ("h", targets, delay);
        //placeGate ("h", [ control ] );
        this.placeCX(control, targets );
        //placeCX(target, [ control ]);
        this.placeGate ("h", targets );
        //placeGate ("h", [ control ] );
    }
    else
    {
        //echo ("cz " + control + " " + targets);
        var targets2 = [ control ];
        this.placeGate("cz", targets2.concat(targets), delay);
    }
}

/*
  control is qubit
  targets is array of qubits
*/
GatePlacer.prototype.placeCX = function(control, targets, delay)
{
    if(!(targets instanceof Array))
        this.echoCommands.echo("ERROR: placeCX targets is not Array!");

    if(targets.length == 0)
        this.echoCommands.echo("ERROR: placeCX targets zero length!");

    var targets2 = [ control ];
    this.placeGate("cx", targets2.concat(targets), delay);
}