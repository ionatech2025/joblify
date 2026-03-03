import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Label } from "../components/ui/label"
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Image, 
  FileText, 
  Download,
  Eye,
  EyeOff,
  MoreVertical,
  Users,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  MessageCircle,
  Building2,
  User,
  Calendar,
  MapPin,
  Briefcase,
  Star,
  Phone,
  Mail,
  ExternalLink,
  Upload,
  X,
  Smile,
  Mic,
  Video,
  Phone as PhoneCall,
  Settings,
  Archive,
  Trash2,
  Copy,
  Flag,
  Shield,
  Bell,
  BellOff
} from "lucide-react"
import { Sidebar } from "../components/Sidebar"

export default function JobChatPage() {
  const navigate = useNavigate()
  const { jobId } = useParams()
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [jobPost, setJobPost] = useState(null)
  const [participants, setParticipants] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [showParticipants, setShowParticipants] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [chatSettings, setChatSettings] = useState({
    notifications: true,
    sound: true,
    readReceipts: true
  })

  // Mock data
  const mockJobPost = {
    id: "job_001",
    title: "Senior React Developer",
    company: {
      id: "comp_001",
      name: "TechCorp Solutions",
      logo: "https://example.com/logo.png",
      isVerified: true
    },
    location: "San Francisco, CA",
    jobType: "FULL_TIME",
    salary: { min: 120000, max: 180000, currency: "USD" },
    hasChat: true,
    chatThreadId: "chat_001",
    status: "ACTIVE"
  }

  const mockCurrentUser = {
    id: "js_001",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    role: "JOB_SEEKER",
    avatar: "https://example.com/avatar1.jpg",
    isAccepted: true,
    applicationId: "app_001"
  }

  const mockParticipants = [
    {
      id: "comp_001",
      name: "TechCorp Solutions",
      role: "COMPANY",
      avatar: "https://example.com/company-logo.png",
      isOnline: true,
      lastSeen: new Date(),
      isVerified: true
    },
    {
      id: "hr_001",
      name: "Jennifer Smith",
      role: "COMPANY_STAFF",
      avatar: "https://example.com/hr-avatar.jpg",
      isOnline: true,
      lastSeen: new Date(),
      title: "HR Manager"
    },
    {
      id: "js_001",
      name: "Sarah Johnson",
      role: "JOB_SEEKER",
      avatar: "https://example.com/avatar1.jpg",
      isOnline: true,
      lastSeen: new Date(),
      isAccepted: true
    },
    {
      id: "js_002",
      name: "Michael Chen",
      role: "JOB_SEEKER",
      avatar: "https://example.com/avatar2.jpg",
      isOnline: false,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      isAccepted: true
    }
  ]

  const mockMessages = [
    {
      id: "msg_001",
      senderId: "hr_001",
      senderName: "Jennifer Smith",
      senderRole: "COMPANY_STAFF",
      content: "Welcome to the chat! We're excited to have you join our team. Let's discuss the next steps for your onboarding.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      readBy: ["js_001", "js_002"],
      attachments: [],
      isSystem: false
    },
    {
      id: "msg_002",
      senderId: "js_001",
      senderName: "Sarah Johnson",
      senderRole: "JOB_SEEKER",
      content: "Thank you! I'm really excited about this opportunity. What should I expect in the coming weeks?",
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
      readBy: ["hr_001", "js_002"],
      attachments: [],
      isSystem: false
    },
    {
      id: "msg_003",
      senderId: "hr_001",
      senderName: "Jennifer Smith",
      senderRole: "COMPANY_STAFF",
      content: "Great question! Here's our onboarding timeline:",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      readBy: ["js_001"],
      attachments: [
        {
          id: "att_001",
          name: "Onboarding_Timeline.pdf",
          type: "pdf",
          size: "2.3 MB",
          url: "https://example.com/onboarding-timeline.pdf"
        }
      ],
      isSystem: false
    },
    {
      id: "msg_004",
      senderId: "system",
      senderName: "System",
      senderRole: "SYSTEM",
      content: "Michael Chen joined the chat",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      readBy: ["hr_001", "js_001", "js_002"],
      attachments: [],
      isSystem: true
    },
    {
      id: "msg_005",
      senderId: "js_002",
      senderName: "Michael Chen",
      senderRole: "JOB_SEEKER",
      content: "Hi everyone! Looking forward to working with the team.",
      timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
      readBy: ["hr_001", "js_001"],
      attachments: [],
      isSystem: false
    }
  ]

  useEffect(() => {
    // Simulate API call to load chat data
    setTimeout(() => {
      setJobPost(mockJobPost)
      setCurrentUser(mockCurrentUser)
      setParticipants(mockParticipants)
      setMessages(mockMessages)
      setIsLoading(false)
    }, 1000)
  }, [jobId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (timestamp) => {
    const now = new Date()
    const messageTime = new Date(timestamp)
    const diffTime = Math.abs(now - messageTime)
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return messageTime.toLocaleDateString()
  }

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return

    setIsSending(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: newMessage.trim(),
      timestamp: new Date(),
      readBy: [currentUser.id],
      attachments: attachments,
      isSystem: false
    }

    setMessages(prev => [...prev, newMsg])
    setNewMessage("")
    setAttachments([])
    setIsSending(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newAttachments = files.map(file => ({
      id: `att_${Date.now()}_${Math.random()}`,
      name: file.name,
      type: file.type.split('/')[1] || 'unknown',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      url: URL.createObjectURL(file)
    }))
    setAttachments(prev => [...prev, ...newAttachments])
  }

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId))
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4" />
      case 'doc':
      case 'docx': return <FileText className="w-4 h-4" />
      case 'png':
      case 'jpg':
      case 'jpeg': return <Image className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const isOwnMessage = (message) => {
    return message.senderId === currentUser?.id
  }

  const getReadReceipt = (message) => {
    if (!chatSettings.readReceipts) return null
    
    const totalParticipants = participants.filter(p => p.role !== 'SYSTEM').length
    const readCount = message.readBy.length
    
    if (readCount === totalParticipants) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />
    } else if (readCount > 1) {
      return <Check className="w-4 h-4 text-gray-400" />
    }
    return null
  }

  // Access control check
  if (!currentUser?.isAccepted) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="COMPANY" onLogout={() => navigate("/login")} />
        <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 flex items-center justify-center">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-red-600 mb-4">Access Restricted</h1>
              <p className="text-lg text-muted-foreground mb-8">
                You can only access this chat if your application has been accepted. 
                Please wait for the company to review your application.
              </p>
              <Button 
                onClick={() => navigate("/my-applications")}
                className="w-full"
              >
                Back to My Applications
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!jobPost?.hasChat) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="COMPANY" onLogout={() => navigate("/login")} />
        <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 flex items-center justify-center">
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-12 h-12 text-yellow-600" />
              </div>
              <h1 className="text-3xl font-bold text-yellow-600 mb-4">Chat Not Available</h1>
              <p className="text-lg text-muted-foreground mb-8">
                This job posting doesn't have chat functionality enabled. 
                Please contact the company directly for communication.
              </p>
              <Button 
                onClick={() => navigate("/my-applications")}
                className="w-full"
              >
                Back to My Applications
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar userType="COMPANY" onLogout={() => navigate("/login")} />
        <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar userType="COMPANY" onLogout={() => navigate("/login")} />
      
      <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300 py-8 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            {/* Chat Header */}
            <Card className="mb-6 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/my-applications")}
                      className="mr-4"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold">{jobPost.title}</h1>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{jobPost.company.name}</span>
                          {jobPost.company.isVerified && (
                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowParticipants(!showParticipants)}
                      className="flex items-center"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {participants.filter(p => p.role !== 'SYSTEM').length} Participants
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chat Messages */}
              <div className="lg:col-span-3">
                <Card className="h-[600px] flex flex-col shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                  {/* Messages Header */}
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Job Chat</span>
                        {typingUsers.length > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {typingUsers.join(', ')} typing...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Bell className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwnMessage(message) ? 'order-2' : 'order-1'}`}>
                          {!isOwnMessage(message) && !message.isSystem && (
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-primary" />
                              </div>
                              <span className="text-sm font-semibold">{message.senderName}</span>
                              {message.senderRole === 'COMPANY_STAFF' && (
                                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                                  HR
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className={`rounded-2xl px-4 py-3 ${
                            message.isSystem 
                              ? 'bg-muted/50 text-center text-sm text-muted-foreground'
                              : isOwnMessage(message)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                          }`}>
                            {message.content}
                            
                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {message.attachments.map((attachment) => (
                                  <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-white/20 rounded-lg">
                                    {getFileIcon(attachment.type)}
                                    <span className="text-sm flex-1">{attachment.name}</span>
                                    <span className="text-xs text-muted-foreground">{attachment.size}</span>
                                    <Button size="sm" variant="outline">
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {!message.isSystem && (
                            <div className={`flex items-center space-x-1 mt-1 ${
                              isOwnMessage(message) ? 'justify-end' : 'justify-start'
                            }`}>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {isOwnMessage(message) && getReadReceipt(message)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <CardContent className="border-t bg-muted/30 p-4">
                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                      <div className="mb-3 p-3 bg-white/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Attachments:</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAttachments([])}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-white rounded">
                              {getFileIcon(attachment.type)}
                              <span className="text-sm flex-1">{attachment.name}</span>
                              <span className="text-xs text-muted-foreground">{attachment.size}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeAttachment(attachment.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="min-h-[60px] resize-none"
                          multiline
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          onClick={handleSendMessage}
                          disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {isSending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Participants Sidebar */}
              {showParticipants && (
                <div className="lg:col-span-1">
                  <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Participants ({participants.filter(p => p.role !== 'SYSTEM').length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {participants
                        .filter(p => p.role !== 'SYSTEM')
                        .map((participant) => (
                          <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              {participant.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold truncate">{participant.name}</span>
                                {participant.isVerified && (
                                  <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span className="capitalize">{participant.role.replace('_', ' ').toLowerCase()}</span>
                                {participant.title && (
                                  <>
                                    <span>•</span>
                                    <span>{participant.title}</span>
                                  </>
                                )}
                              </div>
                              {!participant.isOnline && (
                                <div className="text-xs text-muted-foreground">
                                  Last seen {formatTime(participant.lastSeen)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 