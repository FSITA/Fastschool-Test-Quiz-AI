import BugReport from "@/components/global/BugReport";
import Navbar from "@/components/global/Navbar";
import FormContainer from "@/components/pages/FormContainer";
import Container from "@/components/shared/Container";
import GeminiBadge from "@/components/shared/GeminiBadge";
import Header from "@/components/shared/Header";

export default async function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Container className="mt-40">
        <Header
          title="FastSchool La scuola con un click"
          description="Risparmia tempo prezioso e crea materiali didattici in pochi secondi."
        />
      </Container>
      <FormContainer />
      <GeminiBadge />
      <BugReport />
    </main>
  );
}
