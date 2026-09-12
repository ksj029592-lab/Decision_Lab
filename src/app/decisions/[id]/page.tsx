export default function DecisionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1>Decision Detail: {params.id}</h1>
    </div>
  );
}
