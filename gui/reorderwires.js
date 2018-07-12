// this method is similar to how the causalgraph operates in the current software
// it is a greedy method of placing the gates on the time axis

function WireOrder()
{
    // the number of the wires
    this.wireNumber = new Array();

    this.previousClicked = undefined;
    this.currentClicked = undefined;

    this.resetAllFlags();
}

WireOrder.prototype.resetAllFlags = function()
{
    this.resetFlag = false;
    this.reorderFlag = false;
    this.swapFlag = false;
}

WireOrder.prototype.getWireNumber = function(id)
{
    return this.wireNumber[id];
}

WireOrder.prototype.computeFirstWireUsage = function(gateList)
{
    this.wireNumber = [];

    // first line is the number of vars
    var nrLocalNrVars = Number(gateList[0].split(" ")[1]);

    var tmpNrW = new Array();

    //skip the first three lines
    for (var i = 3; i < gateList.length; i++) {
        var operation = UnscheduledGate.parseUnscheduledGateString(gateList[i]);//gateList[i + 3].split("|")[0];

        for (var j = 0; j < operation.wires.length; j++) {
            var wire = operation.wires[j];
            if (tmpNrW.lastIndexOf(wire) == -1) {
                tmpNrW.push(wire);
            }
        }
    }
    for(var i=0; i<nrLocalNrVars; i++)
    {
        this.wireNumber[tmpNrW[i]] = i;
    }
}

WireOrder.prototype.resetOrder = function(gateList)
{
    this.previousClicked = undefined;
    this.currentClicked = undefined;

    this.wireNumber = [];
    var nrLocalNrVars = Number(gateList[0].split(" ")[1]);

    for (var i = 0; i < nrLocalNrVars; i++)
    {
        this.wireNumber.push(i);
    }
}

WireOrder.prototype.swapQubits = function()
{
    console.log("inside swap" + this.previousClicked + " " + this.currentClicked);

    if(this.swapFlag)
    {
        //two different clicks were performed

        var tmp = this.wireNumber[this.previousClicked];
        this.wireNumber[this.previousClicked] = this.wireNumber[this.currentClicked];
        this.wireNumber[this.currentClicked] = tmp;

        WireOrder.unhighlightButton(this.previousClicked);
        WireOrder.unhighlightButton(this.currentClicked);

        this.previousClicked = undefined;
        this.currentClicked = undefined;
    }
}

WireOrder.prototype.onButtonClickedHandler = function(cClicked)
{
    console.log("CLCICK " + cClicked + " " + this.currentClicked + " " + (this.previousClicked != cClicked));

    if(this.currentClicked == undefined)
    {
        if (this.previousClicked != cClicked)
        {
            //do not click the same button twice
            this.currentClicked = cClicked;

            WireOrder.highlightButton(this.currentClicked);
        }

        if (this.previousClicked == undefined) {
            //something was not clicked before
            this.previousClicked = this.currentClicked;
            this.currentClicked = undefined;
        }
    }
}

WireOrder.highlightButton = function(nr)
{
    console.log("highlight " + nr);
    document.getElementById(this.getButtonId(nr)).style.color = "red";
}

WireOrder.unhighlightButton = function(nr)
{
    console.log("unhighlight " + nr);
    document.getElementById(this.getButtonId(nr)).style.color = "black";
}

WireOrder.getButtonId = function(nr)
{
    return "WireSwapperButton" + nr;
}

WireOrder.prototype.generateButtonsHTML = function(externalFunction)
{
    //empty array of given size
    var reverseWireNumber = Array.apply(null, Array(this.wireNumber.length));

    //I do this to sort on the positions
    for(var i=0; i<this.wireNumber.length; i++)
    {
        var qubitNumber = i;
        var qubitPosition = this.wireNumber[i];
        reverseWireNumber[qubitPosition] = qubitNumber;
    }

    var ret = new Array();
    for(var i=0; i<reverseWireNumber.length; i++)
    {
        // var qubitPosition = i;
        var qubitNumber = reverseWireNumber[i];
        var buttonid = WireOrder.getButtonId(qubitNumber);

        var thisIsMe = this;

        //DOM construction
        ret.push(undefined);//synthetic increase of size
        ret[i] = document.createElement("input");
        ret[i].id = buttonid;
        ret[i].type = "button";
        ret[i].value = qubitNumber;
        ret[i].onclick = function(){
            var param = this.value;
            thisIsMe.onButtonClickedHandler(param);

            if(thisIsMe.previousClicked != undefined && thisIsMe.currentClicked != undefined) {
                externalFunction();
            }
        };
    }

    return ret;
}
