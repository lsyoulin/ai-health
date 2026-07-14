import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import { useState, useRef, useEffect } from 'react'
import './index.scss'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Coach() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '您好！我是知食AI助手。我可以根据您的慢病情况，提供个性化的饮食建议。\n\n您可以说："我今天午餐吃了一碗牛肉面"',
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<any>(null)

  useEffect(() => {
    // 滚动到底部
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 999999
    }
  }, [messages])

  const send = async () => {
    if (!input.trim() || sending) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSending(true)

    // TODO: 调用后端 LLM API
    // 暂时模拟回复
    setTimeout(() => {
      const reply: Message = {
        role: 'assistant',
        content: `根据您的描述，"${userMessage.content}"\n\n💡 分析：\n这是一份典型的中式餐食。建议您：\n1. 注意主食的分量\n2. 搭配足够的蔬菜\n3. 细嚼慢咽，控制进食速度\n\n需要更具体的建议吗？`,
      }
      setMessages(prev => [...prev, reply])
      setSending(false)
    }, 1500)
  }

  return (
    <View className='page-coach'>
      <View className='page-header'>
        <Text className='page-title'>AI 饮食助手</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        className='message-list'
        scrollY
        scrollIntoView='msg-bottom'
      >
        {messages.map((msg, idx) => (
          <View
            key={idx}
            className={`message ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}
          >
            {msg.role === 'assistant' && <Text className='avatar'>🤖</Text>}
            <View className='bubble'>
              <Text className='bubble-text'>{msg.content}</Text>
            </View>
            {msg.role === 'user' && <Text className='avatar'>👤</Text>}
          </View>
        ))}
        {sending && (
          <View className='message message-assistant'>
            <Text className='avatar'>🤖</Text>
            <View className='bubble typing'>
              <Text className='dot'>·</Text>
              <Text className='dot'>·</Text>
              <Text className='dot'>·</Text>
            </View>
          </View>
        )}
        <View id='msg-bottom' />
      </ScrollView>

      <View className='input-bar'>
        <Input
          className='input'
          value={input}
          onInput={(e) => setInput(e.detail.value)}
          placeholder='输入您的饮食问题...'
          confirmType='send'
          onConfirm={send}
        />
        <Button
          className='btn-send'
          onClick={send}
          disabled={!input.trim() || sending}
        >
          发送
        </Button>
      </View>
    </View>
  )
}
