export const defaultPrompts = [
    {
        title: 'Vehicle Identification',
        prompt:
            'Decode this VIN and return Year/Make/Model/Trim/Engine, emission/drive type, plus MOTOR IDs and VCdb IDs. If VIN is missing, tell me exactly what you need to decode it.',
    },
    {
        title: 'Service Procedures',
        prompt:
            'Provide the OEM repair procedure for the specified system/component, including step-by-step instructions, torque specs, required tools, cautions/safety notes, and any relearn/reset steps.',
    },
    {
        title: 'Parts',
        prompt:
            'List OEM part numbers and descriptions for the specified component, with compatibility/fitment for the exact vehicle. Include viable aftermarket alternatives and note any superseded numbers or illustrations if available.',
    },
    {
        title: 'Maintenance schedules',
        prompt:
            'Show the factory maintenance schedule with normal vs severe intervals. Include the operation list for each mileage/time interval and any special notes (fluids, inspections, resets).',
    },
    {
        title: 'Specifications & fluids',
        prompt:
            'List fluid capacities and recommended types/viscosities (engine oil, coolant, ATF, brake, power steering, differential), plus torque specs, tune-up specs, and tire pressures.',
    },
    {
        title: 'Wiring diagrams & component locations',
        prompt:
            'Provide wiring diagrams for the specified system and the physical/component locations. Include connector pinouts, ground points, and fuse/relay references when applicable.',
    },
]
