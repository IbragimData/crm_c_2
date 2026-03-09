export default function Layout({children}: {children: React.ReactNode}) {
    return (
        <section className="main__content main__content_leads">
            {children}
        </section>
    );
}