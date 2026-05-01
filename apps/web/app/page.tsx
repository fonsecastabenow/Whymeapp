export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">Whyme</h1>
        <p className="text-xl text-muted-foreground">
          Recrutamento por valores — match baseado em perfil OCEAN
        </p>
        <div className="flex gap-3 justify-center mt-8 text-sm text-muted-foreground">
          {["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"].map(
            (trait) => (
              <span
                key={trait}
                className="rounded-full border px-3 py-1 font-mono"
              >
                {trait[0]}
              </span>
            )
          )}
        </div>
      </div>
    </main>
  )
}
