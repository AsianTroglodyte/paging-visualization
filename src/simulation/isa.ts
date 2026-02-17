/** ISA: 8-bit instructions. [7:5] opcode, [4:1] addr or [4:0] imm (addi/subi) */

export const OPCODE_LB = 0b000;
export const OPCODE_SB = 0b001;
export const OPCODE_ADD = 0b010;
export const OPCODE_ADDI = 0b011;
export const OPCODE_SUB = 0b100;
export const OPCODE_SUBI = 0b101;
export const OPCODE_BRANCH = 0b110;
export const OPCODE_JUMP = 0b111;

export const OPCODE_NAMES: Record<number, string> = {
    [OPCODE_LB]: "lb",
    [OPCODE_SB]: "sb",
    [OPCODE_ADD]: "add",
    [OPCODE_ADDI]: "addi",
    [OPCODE_SUB]: "sub",
    [OPCODE_SUBI]: "subi",
    [OPCODE_BRANCH]: "branch",
    [OPCODE_JUMP]: "jump",
};

/** Sample program: addi 0, lb 8, addi 5, sb 9, add 8, sub 9, branch 0, jump 1 */
export const SAMPLE_PROGRAM: number[] = [
    (OPCODE_LB << 5), 
    (OPCODE_SB << 5), 
    (OPCODE_ADD << 5), 
    (OPCODE_ADDI << 5), 
    (OPCODE_SUB << 5),
    (OPCODE_SUBI << 5),
    (OPCODE_BRANCH << 5), 
    (OPCODE_JUMP << 5),
];

