/*
  Used for H, P, V etc. but not directly T
*/
function placeGate(type, qubits, delay)
{
    if (! (qubits instanceof Array))
        echo("placeGate qubits is not Array!");

    if(qubits.length == 0)
        echo("ERROR: placeCX qubits zero length!");

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

    echo(msg);
}

/*
  Used for T gate
*/
function placeT(correct, qubits, delay)
{
    placeGate("t", qubits, delay);
    if(correct)
        placeGate("p", qubits, delay);
}

function placeK(ka, kb, kt, decompose, delay)
{
    if(decompose == 1)
    {
        placeGate("ix", [ kt ], delay);
        //this T gate is a direct link from the distillation box
        //placeT(false, [ kt ] );//do not place the T gate, because of the direct link placeholder
        placeCX(ka, [ kt ]);
        placeCX(kb, [ kt ]);
        placeCX(kt, [ kb, ka ]);
        /*
            This is the classic decomposition from the Gidney paper
        //placeT(true, [ka, kb, kt]);
        //placeCX(kt, [ kb, ka ]);
        //placeGate("h", [ kt ] );
        //placeGate("p", [ kt ]);
        */
        //Replaced the last correction with SHS=V\dagger
        placeT(true, [ka, kb]);
        placeT(false, [ kt ], -1);
        placeCX(kt, [ kb, ka ]);
        placeGate("v", [ kt ]);
    }
    else if(decompose == 2)
    {
        placeGate("ix", [ kt ], delay);
        placeCX(kb, [kt]);
        placeT(true, [kt], 0);
        placeCX(ka, [kt]);
        placeT(true, [kt], 0);
        placeCX(kb, [kt]);
        placeT(true, [kt], 0);
        placeGate("h", [kt]);
        placeGate("p", [kt]);
    }
    else
    {
        //echo ("K " + ka + " " + kb + " " + kt);
        placeGate("K", [ka, kb, kt], 0);
    }
}

function placeU(ka, kb, kt, decompose, delay)
{
    if(decompose == 1)
    {
        placeGate ("mx", [ kt ], delay);
        placeCZ(kb, [ ka ], true, -1);
    }
    else if(decompose == 2)
    {
        placeGate ("mx", [ kt ], delay);
        placeCZ(ka, [ kb ], true, -1);
    }
    else if(decompose == 3)
    {
        placeCX(kb, [kt], delay);
        placeGate ("mx", [ kb ]);
        placeCX(ka, [kt]);
    }
    else
    {
        placeGate ("U", [ka, kb, kt], 0);
    }
}

function placeCZ(control, targets, decompose, delay)
{
    if(decompose)
    {
        placeGate ("h", targets, delay);
        //placeGate ("h", [ control ] );
        placeCX(control, targets );
        //placeCX(target, [ control ]);
        placeGate ("h", targets );
        //placeGate ("h", [ control ] );
    }
    else
    {
        //echo ("cz " + control + " " + targets);
        var targets2 = [ control ];
        placeGate("cz", targets2.concat(targets), delay);
    }
}

/*
  control is qubit
  targets is array of qubits
*/
function placeCX(control, targets, delay)
{
    if(!(targets instanceof Array))
        echo("ERROR: placeCX targets is not Array!");

    if(targets.length == 0)
        echo("ERROR: placeCX targets zero length!");

    var targets2 = [ control ];
    placeGate("cx", targets2.concat(targets), delay);
}