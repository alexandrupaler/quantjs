function arraysIntersect(a, b)
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

function isNegatedWire(wire)
{
    return wire < 0;
}

function negateWire(wire)
{
    return -wire;
}

function eliminateWireNegation(wire)
{
    return Math.abs(wire);
}

/**
 * Computes a map between template variables and gate wires.
 * If map is zero length, translation could not be performed
 * @param circuitGate
 * @param templateGate
 * @returns {{the map}}
 */
function translateTemplateVariablesToWires(circuitGate, templateGate)
{
    var ret = {};

    var templateWires = parseTemplateGateString(templateGate).wires;
    var circuitWires = parseUnscheduledGateString(circuitGate).wires;

    for(var i=0; i<templateWires.length; i++)
    {
        var key = templateWires[i];
        var value = circuitWires[i];

        if(isNegatedWire(key) == isNegatedWire(value))
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

function increaseVariableTranslationDictionary(dictionary, templateTranslation)
{
    var tKeys = templateTranslation.keys();
    for(var i=0; i<tKeys.length; i++)
    {
        var key = tKeys[i];

        var value = templateTranslation[key];

        if(isNegatedWire(key))
        {
            key = -key;
            value = -value;
        }

        //nu verific corectitudinea
        dictionary[eliminateWireNegation(key)] = eliminateWireNegation(templateTranslation[key]);
    }

    return dictionary;
}

function translateTemplateToCircuit(dictionary, templateR)
{
    var ret = [];

    for(var i=0; i<templateR.length; i++)
    {
        var parsedTemplate = parseTemplateGateString(templateR[i]);
        var unschedGate = constructEmptyUnscheduledGate();

        unschedGate.gateType = parsedTemplate.gateType;

        for(var j=0; j<parsedTemplate.wires.length; j++)
        {
            var wireVar = parsedTemplate.wires[j];

            var circuitWire = dictionary[eliminateWireNegation(wireVar)];

            if(isNegatedWire(wireVar))
                circuitWire = negateWire(circuitWire);

            unschedGate.wires.push(circuitWire);
        }

        ret.push(toStringUnscheduledGate(unschedGate));
    }

    return ret;
}


function checkTranslationEquality(translation1, translation2)
{
    var ret = true;
    //get the intersection between the variables of the translations
    var varIntersect = arraysIntersect(translation1.keys(), translation2.keys());

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

function sameGateType(circuitGate, templateGate)
{
    var circuitGateType = parseUnscheduledGateString(circuitGate).gateType;
    var templateGateType = parseTemplateGateString(templateGate).gateType;
    return circuitGateType === templateGateType;
}

/**
 * Deocamdata sper sa mearga cand doua porti sunt una langa cealalta in gatelist
 * Trebuie facut, pe baza de intersectii?, sa poata sari peste portile care nu
 * sunt importante
 * @param gateList
 * @param templateS - search circuit
 * @param templateR - replace circuit
 */
function applyTemplate(gateList, templateS, templateR)
{
    for(var i=0; i<gateList.length; i++)
    {
        var indexToIncrease = i;
        var templateFound = true;
        var previousTranslation = {};

        //TODO: could be too complex to generate the same dictionary every time. later improve?
        var varsToWiresDictionary = {};

        for(var j=0; j<templateS.length && indexToIncrease < gateList.length; j++)
        {
            if(sameGateType(gateList[indexToIncrease], templateS[j]))
            {
                var transl = translateTemplateVariablesToWires(gateList[indexToIncrease], templateS[j]);
                if(transl.keys().length == 0)
                {
                    //translation was not possible
                    indexToIncrease = gateList.length;
                    templateFound = false;
                }
                else if(checkTranslationEquality(previousTranslation, transl))
                {
                    indexToIncrease++;

                    varsToWiresDictionary = increaseVariableTranslationDictionary(varsToWiresDictionary, transl);
                    previousTranslation = transl;
                }
                else
                {
                    indexToIncrease = gateList.length;
                    templateFound = false;
                }
            }
            else
            {
                indexToIncrease = gateList.length;
                templateFound = false;
            }
        }

        if(templateFound)
        {
            //translate templateR to circuit
            var translatedTemplateR = translateTemplateToCircuit(varsToWiresDictionary, templateR);

            //replace the circuits
            gateList.splice.apply(i, templateS.length, translatedTemplateR);
        }
    }
}