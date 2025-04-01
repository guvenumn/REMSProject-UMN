-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "inquiryStatus" "InquiryStatus",
ADD COLUMN     "isInquiry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ConversationParticipant" ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isInquiryResponse" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PropertyInquiry" ADD COLUMN     "conversationId" TEXT;

-- AddForeignKey
ALTER TABLE "PropertyInquiry" ADD CONSTRAINT "PropertyInquiry_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
