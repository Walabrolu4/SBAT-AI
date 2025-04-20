export function mapNumber(input: number, from_min: number, from_max: number, to_min: number, to_max: number): number {
  let y: number;
  y = (to_max-to_min)/(from_max-from_min); //Ratio of the ranges
  y = y * (input - from_min); //Multiply by the normalized input (distance from the original min)
  y = y + to_min; //Shift by the target minimum
  return y ;
}