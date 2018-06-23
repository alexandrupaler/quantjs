function GateTemplates()
{

}

GateTemplates.prototype.arraysIntersect = function(a, b)
{
    var t;
    if (b.length > a.length)
    {
        // indexOf to loop over shorter
        t = b;
        b = a;
        a = t;
    }

    return a
        .filter(function (e) {
            return b.indexOf(e) > -1;
    })
        .filter(function (e, i, c) { // extra step to remove duplicates
            return c.indexOf(e) === i;
    });
}

/**
 * Computes a map between template variables and gate wires.
 * If map is zero length, translation could not be performed
 * @param circuitGate
 * @param templateGate
 * @returns {{the map}}
 */
GateTemplates.prototype.translateTemplateVariablesToWires = function(circuitGate, templateGate)
{
    var ret = {};

    var templateWires = TemplateGate.parseTemplateGateString(templateGate).wires;
    var circuitWires = UnscheduledGate.parseUnscheduledGateString(circuitGate).wires;

    for(var i=0; i<templateWires.length; i++)
    {
        var key = templateWires[i];
        var value = circuitWires[i];

        if(WireUtils.isNegatedWire(key) == WireUtils.isNegatedWire(value))
        {
            ret[key] = value;
        }
        else
        {
            ret = {};
            break;
        }
    }

    return ret;
}

GateTemplates.prototype.increaseVariableTranslationDictionary = function(dictionary, templateTranslation)
{
    var tKeys = Object.keys(templateTranslation);
    for(var i=0; i<tKeys.length; i++)
    {
        var key = tKeys[i];

        var value = templateTranslation[key];

        if(WireUtils.isNegatedWire(key))
        {
            key = -key;
            value = -value;
        }

        //nu verific corectitudinea
        dictionary[WireUtils.eliminateWireNegation(key)] = WireUtils.eliminateWireNegation(templateTranslation[key]);
    }

    return dictionary;
}

GateTemplates.prototype.translateTemplateToCircuit = function(dictionary, templateR)
{
    var ret = [];

    for(var i=0; i<templateR.length; i++)
    {
        var parsedTemplate = TemplateGate.parseTemplateGateString(templateR[i]);
        var unschedGate = new UnscheduledGate();

        unschedGate.gateType = parsedTemplate.gateType;
        unschedGate.deltaTime = 0;

        for(var j=0; j<parsedTemplate.wires.length; j++)
        {
            var wireVar = parsedTemplate.wires[j];

            var circuitWire = dictionary[WireUtils.eliminateWireNegation(wireVar)];

            if(WireUtils.isNegatedWire(wireVar))
                circuitWire = WireUtils.negateWire(circuitWire);

            unschedGate.wires.push(circuitWire);
        }

        ret.push(unschedGate.toString());
    }

    return ret;
}


GateTemplates.prototype.checkTranslationEquality = function(translation1, translation2)
{
    var ret = true;
    //get the intersection between the variables of the translations
    var varIntersect = this.arraysIntersect(Object.keys(translation1), Object.keys(translation2));

    for(var i=0; i<varIntersect.length; i++)
    {
        if(translation1[varIntersect[i]] != translation2[varIntersect[i]])
        {
            ret = false;
            break;
        }
    }

    return ret;
}

GateTemplates.prototype.sameGateType = function(circuitGate, templateGate)
{
    var circuitGateType = UnscheduledGate.parseUnscheduledGateString(circuitGate).gateType;
    var templateGateType = TemplateGate.parseTemplateGateString(templateGate).gateType;
    return circuitGateType === templateGateType;
}

/**
 * Deocamdata sper sa mearga cand doua porti sunt una langa cealalta in gatelist
 * Trebuie facut, pe baza de intersectii?, sa poata sari peste portile care nu
 * sunt importante
 * @param ngateList
 * @param templateS - search circuit
 * @param templateR - replace circuit
 */
GateTemplates.prototype.applyTemplate = function(ngateList, templateS, templateR)
{
    var ret = false;

    //skip header
    for(var i=3; i<ngateList.length; i++)
    {
        var indexToIncrease = i;
        var templateFound = true;
        var previousTranslation = {};

        //TODO: could be too complex to generate the same dictionary every time. later improve?
        var varsToWiresDictionary = {};

        var j = -1;
        for(j=0; j<templateS.length && indexToIncrease < ngateList.length; j++)
        {
            if(this.sameGateType(ngateList[indexToIncrease], templateS[j]))
            {
                var transl = this.translateTemplateVariablesToWires(ngateList[indexToIncrease], templateS[j]);
                if(Object.keys(transl).length == 0)
                {
                    //translation was not possible
                    indexToIncrease = ngateList.length;
                    templateFound = false;
                }
                else if(this.checkTranslationEquality(previousTranslation, transl))
                {
                    indexToIncrease++;

                    varsToWiresDictionary = this.increaseVariableTranslationDictionary(varsToWiresDictionary, transl);
                    previousTranslation = transl;
                }
                else
                {
                    indexToIncrease = ngateList.length;
                    templateFound = false;
                }
            }
            else
            {
                indexToIncrease = ngateList.length;
                templateFound = false;
            }
        }

        if(indexToIncrease == ngateList.length && j < templateS.length)
        {
            templateFound = false;
        }

        if(templateFound)
        {
            //translate templateR to circuit
            var translatedTemplateR = this.translateTemplateToCircuit(varsToWiresDictionary, templateR);

            //replace the circuits
            Array.prototype.splice.apply(ngateList, [i, templateS.length].concat(translatedTemplateR));

            // console.log("----template");
            // console.log(templateS);
            // console.log(translatedTemplateR);

            ret = true;
        }
    }

    return ret;
}