/*
    Wires are in general positive integers. Negative wires represent controls which are negative (zero) for controlled gates.
    It happens for the K and U gates, for example.
 */

function WireUtils()
{

}

WireUtils.isNegatedWire = function(wire)
{
    return wire < 0;
}

WireUtils.negateWire = function(wire)
{
    return -wire;
}

WireUtils.eliminateWireNegation = function(wire)
{
    return Math.abs(wire);
}