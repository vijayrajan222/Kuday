export interface RespondCustomClauseDto {
  action: "accept" | "reject" | "counter";
  counterText?: string | undefined;
}
