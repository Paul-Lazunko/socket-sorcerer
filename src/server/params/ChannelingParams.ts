interface JoinChannel {
  channel: string
}

export interface UserJoinChannel extends JoinChannel{
  user: string
}

export interface ConnectionJoinChannel extends JoinChannel{
  connection: string
}

export type ChannelingParams = UserJoinChannel | ConnectionJoinChannel;
