function oneTGatePerTimeStep(tmpGateList)
{
    var nGateList = [];
    if(toolParameters.oneTGatePerTimestep)
    {
        for(var i=0; i<tmpGateList.length; i++)
        {
            var parsedGate = parseUnscheduledGateString(tmpGateList[i]);

            if(parsedGate.gateType[0] == 't')
            {
                for(var j=0; j<parsedGate.wires.length; j++)
                {
                    var firstDelay = parsedGate.deltaTime;
                    if(j==0)
                        firstDelay == 0;
                    nGateList.push("t " + parsedGate.wires[j] + "|" + firstDelay);
                }
            }
            else
            {
                nGateList.push(tmpGateList[i]);
            }
        }
    }
    else
    {
        nGateList = tmpGateList;
    }

    return nGateList;
}