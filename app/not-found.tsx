import EmptyState from "@/components/EmptyState";

export default function NotFound() {
  return (
    <div className="pt-8">
      <EmptyState title="페이지를 찾을 수 없어요" description="주소가 바뀌었거나 축제 정보가 삭제됐을 수 있어요." showHome />
    </div>
  );
}
