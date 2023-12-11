import { PageProps } from "@/.next/types/app/layout";

export default function Dashboard(props: PageProps) {
    return (
        <div>
            <h1>
                Dashboard 
            </h1>
            <p>
                {JSON.stringify(props)}
            </p>
        </div>
    )
}