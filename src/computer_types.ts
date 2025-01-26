export type ComputerAction =
  | "key"
  | "type"
  | "mouse_move"
  | "left_click"
  | "left_click_drag"
  | "right_click"
  | "middle_click"
  | "double_click"
  | "screenshot"
  | "cursor_position";

export type ComputerActionParams = {
  coordinate?: number[];
  text?: string;
  action: ComputerAction;
};
