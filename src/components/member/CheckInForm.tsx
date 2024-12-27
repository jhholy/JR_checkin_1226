import { Button } from '../common/Button';
// ... 其他导入保持不变

export default function CheckInForm({ onSubmit, loading }: Props) {
  // ... 其他代码保持不变

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ... 其他表单元素保持不变 ... */}

      {error && (
        <div className="text-red-600 text-sm text-center">{error}</div>
      )}

      <Button variant="red" loading={loading} type="submit">
        签到 Check-in
      </Button>
    </form>
  );
}