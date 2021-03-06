# How to Run
1. Run `get_firebase_data.py` to download the most recent data from firebase
    - Right now, this script does not have admin privelages, so the firebase rules need to be changed first
        - The rules can be changed here: https://console.firebase.google.com/u/0/project/accessible-teleop/database/accessible-teleop/rules (There is a comment explaining what to do)
    - This script downloads data from `/` which includes both `user` and `state` data
2. Now that the data has been download in json format, any of the data processing scripts can be run (once they have been updated with the correct `snapshot_name`)
    - `json_to_csv.py` coverts the downloaded json file into two csv files. One with cycle data and the other with questionnaire data
    - `calculate_session_lengths.py` calculates metrics about how the total amount of time users spent on the study.
    - `process_data.py` calculates several metrics and graphs about the data
        - This file has the same contents as `data_processing.export.ipynb` to allow for better version control of the code than a raw Jupyter Notebook
    - `process_questionnaire_results.py` calculates metrics from the NASA TLX questionnaire results