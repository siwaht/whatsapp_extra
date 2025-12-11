'use client';

import { Phone, Video, ChevronLeft, Wifi, Signal, Battery } from 'lucide-react';

interface PhonePreviewProps {
  message: string;
  mediaType?: 'text' | 'image' | 'video';
  mediaUrl?: string;
}

export function PhonePreview({ message, mediaType = 'text', mediaUrl }: PhonePreviewProps) {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="flex flex-col">
      <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
        <Phone className="h-4 w-4" />
        Message Preview
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        How your message will appear to recipients
      </p>

      <div className="mx-auto w-[280px] rounded-[2.5rem] bg-slate-900 p-2 shadow-2xl">
        <div className="rounded-[2rem] bg-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-2 text-white text-xs">
            <span className="font-medium">5:34</span>
            <div className="flex items-center gap-1">
              <Signal className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
              <Battery className="h-3 w-3" />
            </div>
          </div>

          <div className="bg-[#0b141a] px-3 py-2 flex items-center gap-3">
            <ChevronLeft className="h-5 w-5 text-[#00a884]" />
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-semibold">
                C
              </div>
              <div>
                <p className="text-white font-medium text-sm">CrunchzApp</p>
                <p className="text-[#8696a0] text-xs">online</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[#00a884]">
              <Video className="h-5 w-5" />
              <Phone className="h-5 w-5" />
            </div>
          </div>

          <div
            className="h-[350px] p-3 flex flex-col justify-end gap-2"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: '#0b141a',
            }}
          >
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg rounded-tl-none bg-[#202c33] px-3 py-2">
                <p className="text-white text-sm">Hi there! How can I help you today?</p>
                <p className="text-[#8696a0] text-[10px] text-right mt-1">5:29 PM</p>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2">
                {mediaType === 'image' && mediaUrl && (
                  <div className="mb-2 rounded overflow-hidden">
                    <img src={mediaUrl} alt="Preview" className="w-full" />
                  </div>
                )}
                {mediaType === 'video' && mediaUrl && (
                  <div className="mb-2 rounded overflow-hidden bg-slate-700 h-32 flex items-center justify-center">
                    <Video className="h-8 w-8 text-slate-400" />
                  </div>
                )}
                <p className="text-white text-sm whitespace-pre-wrap">
                  {message || 'Your message will appear here...'}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <p className="text-[#8696a0] text-[10px]">5:34 PM</p>
                  <svg className="h-4 w-4 text-[#53bdeb]" viewBox="0 0 16 15" fill="currentColor">
                    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.512z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0b141a] px-3 py-3 flex items-center gap-2">
            <div className="flex items-center gap-3 text-[#8696a0]">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm-4-9c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm8 0c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-4 5c2.21 0 4-1.567 4-3.5h-8c0 1.933 1.79 3.5 4 3.5z" />
              </svg>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 003.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 01-2.829 1.171 3.975 3.975 0 01-2.83-1.173 3.973 3.973 0 01-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 00-.834.018l-7.205 7.207a5.577 5.577 0 00-1.645 3.971z" />
              </svg>
            </div>
            <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2">
              <span className="text-[#8696a0] text-sm">Type a message</span>
            </div>
            <div className="text-[#8696a0]">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-4">
        This is a preview of how your message will appear in WhatsApp
      </p>
    </div>
  );
}
