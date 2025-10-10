export interface MirrorPrompt {
  id: string;
  prompt: string;
  response: string;
  reflection: string;
}

export const mirrorPrompts: MirrorPrompt[] = [
  {
    id: "why-chaos",
    prompt: "你为什么执意把产品做得像宇宙频谱？",
    response: "因为规矩是必要的，但是我想听它破碎时的声音。",
    reflection:
      "理智模式下，我会告诉你这是为了激发探索性；歪比模式下，我只是想证明混乱也可以自洽。",
  },
  {
    id: "failure",
    prompt: "最近一次失败是什么？",
    response: "把 CI 流程改成多线程唱票，结果服务器唱到宕机。",
    reflection: "失败提醒我：幽默要先写进 README，再写进代码。",
  },
  {
    id: "obsession",
    prompt: "你偏执地坚守什么？",
    response: "像照顾盆栽一样照顾异常告警，让它们有名字、有情绪。",
    reflection: "偏执感让团队记住，系统是活的，我们只是它的看护人。",
  },
  {
    id: "motivation",
    prompt: "是什么驱动你继续造轮子？",
    response:
      "我相信每次造轮子都是在写一个时间旅行脚本，未来的我会回来感谢现在的胡闹。",
    reflection: "真正的驱动是把荒诞写成流程，让别人可以跟着笑着走完。",
  },
];
