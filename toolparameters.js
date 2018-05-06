var toolParameters = [];

toolParameters.decomposeCliffordT = false;
toolParameters.reorderWires = false;
toolParameters.distillAndConsumeTStates = false;
toolParameters.oneTGatePerTimestep = false;
toolParameters.distillationLength = 3;

toolParameters.nrLogQubits = 0;//number of log qubits used for controlling the logical qubits
toolParameters.nrQubits = 0;// number of logical qubits in the circuit
toolParameters.nrVars = 0;// total number of wires in circuit
toolParameters.lookAhead = 0;//look ahead for the analysis of T gates

toolParameters.circuitGenerator = "";

toolParameters.textAreas = {};

function readToolParameters()
{
    //reinit references cache?
    toolParameters.textAreas["circuit"] = document.getElementById("circuit");
    toolParameters.textAreas["circuitnew"] = document.getElementById("circuitnew");
    toolParameters.textAreas["quirkLink"] = document.getElementById("quirkLink");
    toolParameters.textAreas["stats"] = document.getElementById("stats");

    toolParameters.circuitGenerator = document.getElementById("circuitgenerator").value;

    toolParameters.decomposeCliffordT = document.getElementById("decomposeCheckBox").checked;
    toolParameters.reorderWires = document.getElementById("reorderwires").checked;
    toolParameters.distillAndConsumeTStates = document.getElementById("distillandconsume").checked;
    toolParameters.oneTGatePerTimestep = document.getElementById("onetpertime").checked;
    toolParameters.noVisualisation = document.getElementById("novisual").checked;

    toolParameters.nrLogQubits = Number(document.getElementById("nrq").value);
    toolParameters.lookAhead = Number(document.getElementById("lookahead").value);

    toolParameters.maximumAAvailable = Number(document.getElementById("nrMaxAvailable").value);
    if(toolParameters.maximumAAvailable == 0)
    {
        // disable the limitation
        toolParameters.maximumAAvailable = -1;
    }

    if(toolParameters.circuitGenerator == "majorana")
    {
        toolParameters.nrQubits = Math.pow(2, toolParameters.nrLogQubits);
        toolParameters.nrVars = toolParameters.nrQubits + 2 * toolParameters.nrLogQubits + 1 /*control*/;
    }
    else if(toolParameters.circuitGenerator == "qrom")
    {
        toolParameters.nrQubits = Math.ceil(Math.log2(toolParameters.nrLogQubits));
        toolParameters.nrVars = 2*toolParameters.nrQubits + toolParameters.nrLogQubits + 1 /*control*/;


        // //old version of qrom
        // toolParameters.nrQubits = Math.pow(2, toolParameters.nrLogQubits);
        // toolParameters.nrVars = toolParameters.nrQubits + 2 * toolParameters.nrLogQubits + 1 /*control*/;
    }
    else if(toolParameters.circuitGenerator == "adder")
    {
        toolParameters.nrQubits = 3 * (toolParameters.nrLogQubits - 1 ) + 2;
        toolParameters.nrVars = toolParameters.nrQubits;
    }

}