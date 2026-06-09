import UIKit
#if canImport(heresdk)
import heresdk
#endif

class HereMapView: UIView {

#if canImport(heresdk)
    private let mapView = MapView()
#else
    private let placeholderView: UIView = {
        let view = UIView()
        view.backgroundColor = .systemGray5

        let label = UILabel()
        label.text = "HERE SDK not available"
        label.textColor = .darkGray
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(label)

        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])

        return view
    }()
#endif

    override init(frame: CGRect) {
        super.init(frame: frame)

#if canImport(heresdk)

        addSubview(mapView)

        mapView.translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
            mapView.topAnchor.constraint(equalTo: topAnchor),
            mapView.bottomAnchor.constraint(equalTo: bottomAnchor),
            mapView.leadingAnchor.constraint(equalTo: leadingAnchor),
            mapView.trailingAnchor.constraint(equalTo: trailingAnchor)
        ])

        loadMap()

#else

        addSubview(placeholderView)

        placeholderView.translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
            placeholderView.topAnchor.constraint(equalTo: topAnchor),
            placeholderView.bottomAnchor.constraint(equalTo: bottomAnchor),
            placeholderView.leadingAnchor.constraint(equalTo: leadingAnchor),
            placeholderView.trailingAnchor.constraint(equalTo: trailingAnchor)
        ])

#endif
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

#if canImport(heresdk)

    private func loadMap() {

        mapView.mapScene.loadScene(
            mapScheme: .normalDay
        ) { error in

            guard error == nil else {
                print("HERE Map load error: \(String(describing: error))")
                return
            }

            let camera = self.mapView.camera

            let distance = MapMeasure(
                kind: .distanceInMeters,
                value: 1000
            )

            camera.lookAt(
                point: GeoCoordinates(
                    latitude: 52.517543,
                    longitude: 13.408991
                ),
                zoom: distance
            )
        }
    }

#endif
}