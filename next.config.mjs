/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: "",
    compiler: { styledComponents: true },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ["@svgr/webpack"]
        })

        return config
    }
};

export default nextConfig;
